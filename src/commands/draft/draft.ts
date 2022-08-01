import {
  addDays,
  differenceInMilliseconds,
  formatDuration,
  hoursToMilliseconds,
  intervalToDuration,
  minutesToMilliseconds,
  secondsToMilliseconds,
  subHours,
} from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'
import {
  CommandInteraction,
  Guild,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  User as DiscordUser,
} from 'discord.js'
import { firestore } from 'firebase-admin'
import debounce from 'lodash.debounce'
import table from 'text-table'
import { client } from '../../client'
import {
  addLossToPlayer,
  addWinToPlayer,
  drafts,
  getGuildSettings,
  players,
  Settings,
} from '../../firebase'
import { defaultPlayerCount } from '../../helpers/constants'
import { parseTime } from '../../helpers/time'
import { userHasRole } from '../permissions'
import { getMessage } from './registry'

interface User extends DiscordUser {
  nickname?: string
}

export interface DocUser {
  id: string
  username: string
  nickname?: string
}

export interface LogUser extends DocUser {
  durationInDraft: number
  durationInCount: number
}

export interface DraftOptions {
  hostId: string
  guildId: string
  channelId: string
  time: string | null
  location: string
  count: number
  description: string
  skipSignupPing: boolean
  openPool: boolean
  interaction?: CommandInteraction
}

export interface DraftDoc extends DraftOptions {
  createdAt: FirebaseFirestore.Timestamp
  canceledAt: FirebaseFirestore.Timestamp
  date: FirebaseFirestore.Timestamp
  messages: {
    embed: string
    opened: string | null
    full: string | null
    canceled: string | null
  }
  teams: {
    [k: number]: string[] | DocUser[]
  }
  users: DocUser[]
  usersLog: LogUser[]
}

export function serializeDraft(draft: Draft) {
  return {
    // options
    channelId: draft.channelId,
    count: draft.count,
    description: draft.description,
    guildId: draft.guildId,
    hostId: draft.hostId,
    location: draft.location,
    openPool: draft.openPool,
    skipSignupPing: draft.skipSignupPing,
    time: draft.time,

    //state
    canceledAt: draft.canceledAt,
    date: draft.date,
    guildName: draft.guild?.name,
    messages: {
      embed: draft.messages.embed || null,
      opened: draft.messages.opened || null,
      full: draft.messages.full || null,
      canceled: draft.messages.canceled || null,
    },
    teams: Object.entries(draft.teams).reduce((acc, [key, users]) => {
      return {
        ...acc,
        [key]: users.map((u) => ({ id: u.id, username: u.username, nickname: u.nickname })),
      }
    }, {} as { [k: string]: DocUser[] }),
    users: draft.users.map((u) => ({ id: u.id, name: u.username, nickname: u.nickname })),
    usersLog: draft.usersLog,
  }
}

export async function deserializeDraft(
  guild: Guild,
  docId: string,
  data: DraftDoc,
): Promise<Draft> {
  const userIds = data.users?.map((u: any) => (typeof u === 'string' ? u : u.id))

  const membersCollection = await guild.members.fetch({ user: userIds })

  const draft = new Draft({
    channelId: data.channelId,
    count: data.count,
    description: data.description,
    guildId: data.guildId,
    hostId: data.hostId,
    location: data.location,
    skipSignupPing: data.skipSignupPing,
    openPool: data.openPool,
    time: data.time,
  })

  draft.id = docId
  draft.date = data.date.toDate()
  draft.messages = data.messages

  const users = data.users.map((user) => membersCollection.get(user.id)?.user).filter((u) => u)

  draft.usersLog = data.usersLog

  draft.addUsers(...(users as User[]))

  for (let [key, users] of Object.entries(data.teams)) {
    const team = draft.teams[parseInt(key, 10)]

    users.forEach((user) => {
      const id = typeof user === 'string' ? user : user.id
      const member = membersCollection.get(id)
      if (member) {
        team.push(member.user)
      }
    })
  }

  return draft
}

export class Draft {
  // options
  channelId: string
  count: number
  description: string | null
  guildId: string
  hostId: string
  location: string
  openPool: boolean
  skipSignupPing: boolean
  time: string | null

  // state
  id?: string
  canceledAt: Date | null = null
  date: Date = new Date()
  messages: {
    embed?: string | null
    opened?: string | null
    full?: string | null
    canceled?: string | null
  } = {}
  settings: Settings | null = null
  teams: { [k: number]: User[] } = {}
  users: User[] = []
  usersLog: LogUser[] = []

  openedTimer?: NodeJS.Timeout
  fullTimer?: NodeJS.Timeout
  userLogTimer?: NodeJS.Timeout
  saveTimer?: NodeJS.Timeout
  interaction?: CommandInteraction
  updateEmbedMessageDebounced: () => void = () => {}

  constructor({
    hostId,
    guildId,
    channelId,
    time,
    location,
    count = defaultPlayerCount,
    description = '',
    skipSignupPing = false,
    openPool = false,
  }: DraftOptions) {
    const now = new Date()
    let date = time ? zonedTimeToUtc(parseTime(time), 'Europe/Paris') : now
    if (date < now) {
      date = addDays(date, 1)
    }

    this.channelId = channelId
    this.count = count
    this.date = date
    this.description = description
    this.guildId = guildId
    this.hostId = hostId
    this.location = location
    this.openPool = openPool
    this.skipSignupPing = skipSignupPing
    this.time = time

    this.updateEmbedMessageDebounced = debounce(this.updateEmbedMessage, secondsToMilliseconds(5), {
      leading: true,
      trailing: true,
    })
  }

  public async initializeNewDraft() {
    await this.loadSettings()
    await this.initializeTimers()
    await this.scheduleOpenedMessage()
    await this.sendEmbedMessage()
    await this.save()
  }

  public async initializeExistingDraft() {
    await this.loadSettings()
    await this.initializeTimers()
    await this.collectInteractions()
  }

  public get guild(): Guild | undefined {
    return client.guilds.cache.get(this.guildId)
  }

  public get channel() {
    const channel = this.guild?.channels.cache.get(this.channelId)

    if (channel?.isText()) {
      return channel
    }
  }

  private get signupDate() {
    return subHours(this.date, 1)
  }

  private initializeTimers() {
    this.userLogTimer = setInterval(() => this.updateUserLog(), secondsToMilliseconds(1))

    this.saveTimer = setInterval(() => this.save(false), minutesToMilliseconds(5))
  }

  private get isPastSignupTime() {
    return new Date() > this.signupDate
  }

  private get isPastStartTime() {
    return new Date() > this.date
  }

  private get usersInCount() {
    return this.users.slice(0, this.count)
  }

  private scheduleOpenedMessage() {
    const diff = differenceInMilliseconds(new Date(), this.signupDate)

    const timeout = diff < 0 ? Math.abs(diff) : 0

    this.openedTimer = setTimeout(
      () => this.sendOpenedMessage('Sign-ups are open, register now!'),
      timeout,
    )
  }

  private timestamp(date: Date) {
    return Math.floor(date.getTime() / 1000)
  }

  private isUserOnTeam(user: User, team: number) {
    return !!this.teams[team]?.find((u) => u.id === user.id)
  }

  private async loadSettings() {
    try {
      this.settings = await getGuildSettings(this.guildId)
    } catch (e) {
      console.log(`Failed to load settings for guild ${this.guild?.name}`)
    }
  }

  private async getMessage(id?: string | null) {
    if (this.guild && id) {
      return await getMessage(this.guild, this.channelId, id)
    }
  }

  private async getNickname(user: User) {
    let member = this.guild?.members.cache.get(user.id)

    if (!member) {
      member = await this.guild?.members.fetch(user.id)
    }

    return member?.nickname || user.username
  }

  private createComponents() {
    const row = new MessageActionRow()

    row.addComponents(
      new MessageButton()
        .setCustomId('join')
        .setLabel('Join')
        .setStyle(!this.isPastSignupTime ? 'SECONDARY' : 'PRIMARY')
        .setDisabled(!this.isPastSignupTime),
      new MessageButton()
        .setCustomId('leave')
        .setLabel('Leave')
        .setStyle('SECONDARY')
        .setDisabled(!this.isPastSignupTime),
    )

    return row
  }

  private async createEmbed() {
    const divider = (i: number) => (i === this.count ? '-----\n' : '')

    const signups: string[] = []

    for (const [i, user] of this.users.entries()) {
      const doc = await (await players.doc(user.id).get()).data()

      const ign = doc?.ign ? ` (${doc.ign})` : ''

      const str = this.openPool
        ? `- ${user.nickname}${ign}`
        : `${divider(i)}${i + 1}. ${user.nickname}${ign}`

      signups.push(str.replace(/_/g, '\\_'))
    }

    const embed = new MessageEmbed()

    embed.addField(
      'Start Time',
      this.isPastStartTime
        ? `~~<t:${this.timestamp(this.date)}>~~ In Progress`
        : `<t:${this.timestamp(this.date)}>`,
    )

    if (!this.isPastSignupTime) {
      embed.addField('Sign-ups begin at', `<t:${this.timestamp(this.signupDate)}>`)
    }

    embed.addField('Meeting Location', this.location)

    embed.addField(
      'Draft Type',
      this.openPool
        ? 'Open Pool - Captains can pick anyone'
        : 'Closed Pool - Captains can pick from the first 16',
    )

    if (this.description) {
      embed.addField('Description', this.description)
    }

    embed
      .addField('Player Count', `${this.users.length} / ${this.count}`)
      .addField('Host', `<@${this.hostId}>`)
      .addField('Signups', `${signups.length ? signups.join('\n') : 'None'}`)

    Object.keys(this.teams)
      .sort()
      .forEach((key) => {
        const t =
          this.teams[parseInt(key, 10)]?.map((u, i) => `${i + 1}. ${u.nickname}`).join('\n') ||
          'None'

        if (t) {
          embed.addField(`Team ${key}`, t, true)
        }
      })

    return embed
  }

  private async sendEmbedMessage() {
    if (!this.channel?.isText()) {
      throw new Error('Draft must be created in a text channel')
    }

    const embed = await this.createEmbed()

    const msg = await this.channel.send({
      content: `A draft has been ${this.time ? 'scheduled' : 'created'}`,
      embeds: [embed],
      components: [this.createComponents()],
    })

    if (msg) {
      this.messages.embed = msg.id

      this.collectInteractions()
    }
  }

  private async updateEmbedMessage() {
    try {
      const message = await this.getMessage(this.messages.embed)

      if (message?.editable) {
        const embed = await this.createEmbed()

        if (this.canceledAt) {
          await message?.edit({
            content: 'The draft has been canceled',
            embeds: [],
            components: [],
          })
        } else {
          await message?.edit({
            embeds: [embed],
            components: [this.createComponents()],
          })
        }
      }
    } catch (e) {
      console.log('Failed to update message')
      console.log(e)
    }
  }

  private async sendOpenedMessage(content: string) {
    if (!this.settings?.draft_player_role || this.skipSignupPing) {
      return
    }

    if (this.messages.opened) {
      const msg = await this.getMessage(this.messages.opened)

      if (msg?.deletable) {
        msg.delete()
      }
    }

    try {
      const openedMessage = await this.channel?.send(
        `${content} <@&${this.settings.draft_player_role}>`,
      )

      this.messages.opened = openedMessage?.id || null

      this.save()
    } catch (e) {
      console.log(`Failed to send opened message to ${this.channel?.name}`)
      console.log(e)
    }
  }

  private async sendFullMessage() {
    if (!this.settings?.draft_player_role || this.skipSignupPing || this.messages.full) {
      return
    }

    const mentions = this.usersInCount.map((u) => `<@${u.id}>`).join(' ')

    try {
      const fullMsg = await this.channel?.send(
        `The draft has enough players, please come to ${this.location} <@&${this.settings.draft_player_role}> ${mentions}`,
      )

      this.messages.full = fullMsg?.id || null

      this.save()
    } catch (e) {
      console.log(`Failed to send draft full message to ${this.channel?.name}`)
      console.log(e)
    }
  }

  private createUserLog() {
    const log = this.usersLog.map((u, i) => {
      const did = intervalToDuration({ start: 0, end: u.durationInDraft })
      const dic = intervalToDuration({ start: 0, end: u.durationInCount })
      const f = (n: number = 0) => String(n).padStart(2, '0')

      return [
        `${i + 1}.`,
        u.nickname || u.username,
        `${f(did.hours)}:${f(did.minutes)}`,
        `${f(dic.hours)}:${f(dic.minutes)}`,
      ]
    })

    const t = table(
      [['', 'Name', '     In Draft', '     In Count'], ['', '', '', '', ''], ...log],
      {
        align: ['l', 'l', 'r', 'r'],
      },
    )

    return '```' + t + '```'
  }

  private async sendCanceledMessage() {
    const draftDuration = intervalToDuration({
      start: 0,
      end: differenceInMilliseconds(new Date(), this.date),
    })

    const content = [
      `Draft has been canceled after ${formatDuration(draftDuration, {
        format: ['hours', 'minutes'],
      })}`,
    ]

    if (this.usersLog.length > 0) {
      content.push(this.createUserLog())
    }

    try {
      const canceledMsg = await this.channel?.send({ content: content.join('\n') })

      if (canceledMsg) {
        this.messages.canceled = canceledMsg.id
      }

      setTimeout(() => {
        try {
          canceledMsg?.deletable && canceledMsg.delete()
        } catch (e) {
          console.log('Could not delete canceled message')
          console.log(e)
        }
      }, minutesToMilliseconds(60))
    } catch (e) {
      console.log(`Failed to send canceled message to ${this.channel?.name}`)
      console.log(e)
    }
  }

  private updateUserLog() {
    if (!this.isPastStartTime) {
      return
    }

    this.users.forEach((u) => {
      const log = this.usersLog.find((ul) => ul.id === u.id)

      if (log) {
        log.durationInDraft += secondsToMilliseconds(1)

        if (this.isUserInCount(u)) {
          log.durationInCount += secondsToMilliseconds(1)
        }
      }
    })
  }

  private async collectInteractions() {
    const message = await this.getMessage(this.messages.embed)

    if (message) {
      const collector = message.createMessageComponentCollector({
        dispose: true,
        time: hoursToMilliseconds(72),
      })

      collector.on('collect', async (i) => {
        if (i.customId === 'join') {
          if (this.isUserInDraft(i.user)) {
            await i.reply({ content: `You have already joined the draft`, ephemeral: true })
          } else {
            await this.addUsers(i.user)

            await i.reply({ content: `You have joined the draft!`, ephemeral: true })
          }
        } else if (i.customId === 'leave') {
          if (this.isUserInDraft(i.user)) {
            await this.removeUsers(i.user)

            i.reply({ content: `You have left the draft`, ephemeral: true })
          } else {
            await i.reply({ content: `You are not in the draft`, ephemeral: true })
          }
        }
      })
    }
  }

  public isUserInDraft(user: User) {
    return this.users.findIndex((u) => u.id === user.id) >= 0
  }

  public isUserInCount(user: User) {
    return !!this.usersInCount.find((u) => u.id === user.id)
  }

  public isUserAModerator(user: User) {
    if (this.guild) {
      return userHasRole(this.guild, user.id, this.settings?.draft_moderator_role || '')
    }

    return false
  }

  public isUserACaptain(user: User) {
    return Object.values(this.teams).some((team) =>
      team.some((u, i) => u.id === user.id && i === 0),
    )
  }

  public isUserOnATeam(user: User) {
    return Object.values(this.teams).some((t) => t.some((u) => u.id === user.id))
  }

  public async addUsers(...users: User[]) {
    for (let user of users) {
      if (user && !this.isUserInDraft(user)) {
        user.nickname = await this.getNickname(user)

        this.users = [...this.users, user]
      }

      if (!this.usersLog.find((u) => u.id === user.id)) {
        this.usersLog.push({
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          durationInDraft: 0,
          durationInCount: 0,
        })
      }
    }

    if (this.users.length >= this.count && !this.fullTimer) {
      this.fullTimer = setTimeout(() => this.sendFullMessage(), minutesToMilliseconds(1))
    }

    this.save()
  }

  public async removeUsers(...users: User[]) {
    for (let user of users) {
      this.users = this.users.filter((u) => u.id !== user.id)

      Object.keys(this.teams).forEach((key) => {
        const team = parseInt(key, 10)
        this.teams[team] = this.teams[team]?.filter((u) => u.id !== user.id) ?? []
      })
    }

    if (this.users.length < this.count) {
      clearTimeout(this.fullTimer)

      this.fullTimer = undefined
    }

    this.save()
  }

  public async reorderUser(user: User, position: number) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.splice(position - 1, 0, user)

    this.save()
  }

  public async setTeamCaptain(user: User, team: number) {
    this.teams[team]?.unshift(user)

    this.save()
  }

  public async addUserToTeam(user: User, team: number) {
    if (this.isUserInCount(user) && !this.isUserOnTeam(user, team)) {
      this.teams[team]?.push(user)
    }

    this.save()
  }

  public async removeUserFromTeam(user: User, team: number) {
    this.teams[team] = this.teams[team]?.filter((u) => u.id !== user.id) ?? []

    this.save()
  }

  public async swapUserTeam(user: User) {
    if (this.isUserOnTeam(user, 1)) {
      this.removeUserFromTeam(user, 1)
      this.addUserToTeam(user, 2)
    } else if (this.isUserOnTeam(user, 2)) {
      this.removeUserFromTeam(user, 2)
      this.addUserToTeam(user, 1)
    }

    this.save()
  }

  public async addUserToCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 1)) {
      this.addUserToTeam(user, 1)
    } else if (this.isUserOnTeam(captain, 2)) {
      this.addUserToTeam(user, 2)
    }

    this.save()
  }

  public async removeUserFromCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 1)) {
      this.removeUserFromTeam(user, 1)
    } else if (this.isUserOnTeam(captain, 2)) {
      this.removeUserFromTeam(user, 2)
    }

    this.save()
  }

  public async cancel() {
    clearTimeout(this.openedTimer || undefined)

    clearTimeout(this.userLogTimer || undefined)

    clearTimeout(this.fullTimer || undefined)

    const embedMessage = await this.getMessage(this.messages.embed)

    const openedMessage = await this.getMessage(this.messages.opened)

    const fullMsg = await this.getMessage(this.messages.full)

    await this.sendCanceledMessage()

    this.canceledAt = new Date()

    this.save(false)

    if (embedMessage?.deletable) {
      embedMessage.delete()
    }

    if (openedMessage?.deletable) {
      openedMessage.delete()
    }

    if (fullMsg?.deletable) {
      fullMsg.delete()
    }
  }

  public async save(updateEmbed: boolean = true) {
    const data = serializeDraft(this)

    try {
      if (this.id) {
        await drafts.doc(this.id)?.set(data, { merge: true })
      } else {
        const doc = drafts.doc()

        await doc.set({ ...data, createdAt: firestore.Timestamp.now() })

        this.id = doc.id
      }

      if (updateEmbed) {
        this.updateEmbedMessageDebounced()
      }
    } catch (e) {
      console.log('Draft failed to save')
      console.log(e)
    }
  }

  public async edit(
    host: DiscordUser | null,
    location: string | null,
    description: string | null,
    openPool: boolean | null,
  ) {
    if (host) {
      this.hostId = host.id
    }

    if (location) {
      this.location = location
    }

    if (description) {
      this.description = description
    }

    if (openPool !== null) {
      this.openPool = openPool
    }

    this.save()
  }

  public async reset() {
    this.teams = {}

    this.save()
  }

  public async winner(team: number) {
    if (team === 1) {
      this.teams[1].forEach((u) => addWinToPlayer(u.id))
      this.teams[2].forEach((u) => addLossToPlayer(u.id))
    } else if (team === 2) {
      this.teams[1].forEach((u) => addLossToPlayer(u.id))
      this.teams[2].forEach((u) => addWinToPlayer(u.id))
    }
  }
}
