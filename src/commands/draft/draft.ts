import {
  addDays,
  differenceInMilliseconds,
  formatDuration,
  intervalToDuration,
  subHours,
} from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'
import {
  CommandInteraction,
  Guild,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  User,
} from 'discord.js'
import { client } from '../../client'
import { drafts, getGuildSettings, players, Settings } from '../../firebase'
import { defaultPlayerCount } from '../../helpers/constants'
import { parseTime } from '../../helpers/time'
import { userHasRole } from '../permissions'
import { getMessage } from './registry'

export interface PartialUser {
  id: string
  name: string
}

export interface DraftOptions {
  hostId: string
  guildId: string
  channelId: string
  time: string | null
  location: string
  count: number
  description: string
  readyWaitTime: number
  skipSignupPing: boolean
  interaction?: CommandInteraction
}

export interface DraftDoc extends DraftOptions {
  canceled: boolean
  date: FirebaseFirestore.Timestamp
  hasSentSignupPing: boolean
  embedMessageId: string
  readyUsers: string[]
  signupMessageId: string | null
  teams: { [k: number]: string[] | PartialUser[] }
  users: string[] | PartialUser[]
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
    readyWaitTime: draft.readyWaitTime,
    skipSignupPing: draft.skipSignupPing,
    time: draft.time,

    //state
    canceled: draft.canceled,
    date: draft.date,
    embedMessageId: draft.embedMessageId,
    guildName: draft.guild?.name,
    hasSentSignupPing: draft.hasSentSignupPing,
    readyUsers: draft.readyUsers,
    signupMessageId: draft.signupMessageId,
    teams: Object.entries(draft.teams).reduce((acc, [key, users]) => {
      return {
        ...acc,
        [key]: users.map((u) => ({ id: u.id, name: draft.nicknames[u.id] || u.username })),
      }
    }, {} as { [k: string]: PartialUser[] }),
    users: draft.users.map((u) => ({ id: u.id, name: draft.nicknames[u.id] || u.username })),
  }
}

export async function deserializeDraft(guild: Guild, data: DraftDoc): Promise<Draft> {
  const userIds = data.users?.map((u: any) => (typeof u === 'string' ? u : u.id))

  const membersCollection = await guild.members.fetch({ user: userIds })

  const draft = new Draft({
    channelId: data.channelId,
    count: data.count,
    description: data.description,
    guildId: data.guildId,
    hostId: data.hostId,
    location: data.location,
    readyWaitTime: data.readyWaitTime,
    skipSignupPing: data.skipSignupPing,
    time: data.time,
  })

  draft.date = data.date.toDate()
  draft.hasSentSignupPing = data.hasSentSignupPing
  draft.embedMessageId = data.embedMessageId
  draft.readyUsers = data.readyUsers
  draft.signupMessageId = data.signupMessageId

  draft.addUsers(
    data.users.map((user) => {
      const id = typeof user === 'string' ? user : user.id

      return membersCollection.get(id)?.user
    }),
  )

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
  readyWaitTime: number
  skipSignupPing: boolean
  time: string | null

  // state
  canceled: boolean = false
  date: Date = new Date()
  hasSentSignupPing: boolean = false
  embedMessageId: string | null = null
  readyUsers: string[] = []
  settings: Settings | null = null
  signupMessageId: string | null = null
  teams: { [k: number]: User[] } = { 1: [], 2: [] }
  users: User[] = []
  nicknames: { [k: string]: string } = {}

  interaction?: CommandInteraction

  constructor({
    hostId,
    guildId,
    channelId,
    time,
    location,
    count = defaultPlayerCount,
    description = '',
    readyWaitTime = 5,
    skipSignupPing = false,
    interaction,
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
    this.readyWaitTime = readyWaitTime
    this.skipSignupPing = skipSignupPing
    this.time = time
    this.interaction = interaction
  }

  public async initializeNewDraft() {
    await this.loadSettings()
    await this.scheduleSignupPing()
    await this.sendEmbedMessage()
    await this.save()
  }

  public async initializeExistingDraft() {
    await this.loadSettings()
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

  private get signupDateDiff() {
    return
  }

  private get isPastSignupTime() {
    return new Date() > this.signupDate
  }

  private get isPastStartTime() {
    return new Date() > this.date
  }

  private get isAboveCount() {
    return this.usersInCount.length >= this.count
  }

  private get needsOneMorePlayer() {
    return this.users.length === this.count - 1
  }

  private get canIndicateReady() {
    return this.isPastStartTime && this.isAboveCount
  }

  private get usersInCount() {
    return this.users.slice(0, this.count)
  }

  private scheduleSignupPing() {
    const diff = differenceInMilliseconds(new Date(), this.signupDate)

    const timeout = diff < 0 ? Math.abs(diff) : 0

    setTimeout(() => this.sendSignupPing('Sign-ups are open, register now!'), timeout)
  }

  private get countdownFormatted() {
    const start = differenceInMilliseconds(new Date(), this.signupDate)

    if (start > 0) {
      return ''
    }

    const duration = intervalToDuration({ start, end: 0 })

    const format = duration.hours || duration.minutes ? ['hours', 'minutes'] : ['seconds']

    return formatDuration(duration, {
      zero: true,
      format,
    })
  }

  private formatReady(user: User) {
    return this.readyUsers.find((id) => id === user.id) ? '✓ ' : ''
  }

  private isUserInDraft(user: User) {
    return this.users.findIndex((u) => u.id === user.id) >= 0
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

  private async getMessage(id: string | null) {
    if (this.guild && id) {
      return await getMessage(this.guild, this.channelId, id)
    }
  }

  private async getNickname(user: User) {
    let member = this.guild?.members.cache.get(user.id)

    if (!member) {
      member = await this.guild?.members.fetch(user)
    }

    return member?.nickname || user.username
  }

  private createComponents() {
    const row = new MessageActionRow()

    row.addComponents(
      new MessageButton()
        .setCustomId('ready')
        .setLabel('Ready')
        .setStyle('SUCCESS')
        .setEmoji('✅')
        .setDisabled(!this.canIndicateReady),
    )

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
    const time = Math.floor(this.date.getTime() / 1000)

    const divider = (i: number) => (i === this.count ? '-----\n' : '')

    const signups: string[] = []

    for (const [i, user] of this.users.entries()) {
      const doc = await (await players.doc(user.id).get()).data()

      const ign = doc?.ign ? ` (${doc.ign})` : ''

      const nickname = this.nicknames[user.id] ?? user.username

      signups.push(`${divider(i)}${i + 1}. ${this.formatReady(user)}${nickname}${ign}`)
    }

    const embed = new MessageEmbed()

    embed.addField('Start Time', this.isPastStartTime ? 'In Progress' : `<t:${time}>`)

    if (!this.isPastSignupTime) {
      embed.addField('Sign-ups Start In', this.countdownFormatted)
    }

    embed.addField('Meeting Location', this.location)

    if (this.description) {
      embed.addField('Description', this.description)
    }

    embed
      .addField('Player Count', String(this.count))
      .addField('Host', `<@${this.hostId}>`)
      .addField('\u200b', '-----')
      .addField('Signups', `${signups.length ? signups.join('\n') : 'None'}`)

    Object.keys(this.teams)
      .sort()
      .forEach((key) => {
        const t =
          this.teams[parseInt(key, 10)]
            ?.map((u, i) => `${i + 1}. ${this.nicknames[u.id] || u.username}`)
            .join('\n') || 'None'

        if (t) {
          embed.addField(`Team ${key}`, t, true)
        }
      })

    return embed
  }

  private async moveUserToBackOfQueue(user: User) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.push(user)

    await this.updateEmbedMessage()
  }

  private async toggleReady(user: User) {
    if (this.readyUsers.includes(user.id)) {
      this.readyUsers = this.readyUsers.filter((id) => id !== user.id)
    } else {
      this.readyUsers = [...this.readyUsers, user.id]
    }

    await this.updateEmbedMessage()
  }

  private async sendSignupPing(content: string) {
    if (!this.settings?.draft_player_role || this.skipSignupPing) {
      return
    }

    if (this.signupMessageId) {
      const msg = await this.getMessage(this.signupMessageId)

      if (msg?.deletable) {
        msg.delete()
      }
    }

    try {
      const signupMsg = await this.channel?.send(
        `${content} <@&${this.settings.draft_player_role}>`,
      )

      this.signupMessageId = signupMsg?.id || null

      this.save()
    } catch (e) {
      console.log(`Failed to send sign-up notification message to  #${this.channel?.name}`)
      console.log(e)
    }
  }

  public async collectInteractions() {
    const message = await this.getMessage(this.embedMessageId)

    if (message) {
      const collector = message.createMessageComponentCollector({
        dispose: true,
        time: 7 * 24 * 60 * 60 * 1000,
      })

      collector.on('collect', async (i) => {
        console.log('Received interaction', i.user.username, i.customId)

        if (i.customId === 'join') {
          if (this.isUserInDraft(i.user)) {
            i.reply({ content: 'You have already joined the draft', ephemeral: true })
          } else {
            this.addUser(i.user)

            i.reply({ content: 'You have joined the draft', ephemeral: true })
          }
        } else if (i.customId === 'leave') {
          this.removeUser(i.user)

          i.reply({ content: 'You have left the draft', ephemeral: true })
        } else if (i.customId === 'ready') {
          this.toggleReady(i.user)

          i.reply({ content: 'You have changed your ready status', ephemeral: true })
        }
      })
    }
  }

  public async sendEmbedMessage() {
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
      this.embedMessageId = msg.id

      this.collectInteractions()
    }
  }

  public async updateEmbedMessage(save: boolean = true) {
    try {
      const message = await this.getMessage(this.embedMessageId)

      if (message?.editable) {
        const embed = await this.createEmbed()

        await message?.edit({
          embeds: [embed],
          components: [this.createComponents()],
        })
      }
    } catch (e) {
      console.log('Failed to update message')
      console.log(e)
    }

    try {
      if (save) {
        await this.save()
      }
    } catch (e) {
      console.log('Save after update failed')
      console.log(e)
    }
  }

  public isUserInCount(user: User) {
    return !!this.usersInCount.find((u) => u.id === user.id)
  }

  public isUserOnATeam(user: User) {
    return Object.values(this.teams).some((t) => t.some((u) => u.id === user.id))
  }

  public isUserAModerator(user: User) {
    if (this.guild) {
      console.log(this.settings?.draft_moderator_role)
      return userHasRole(this.guild, user, this.settings?.draft_moderator_role || '')
    }

    return false
  }

  public isUserACaptain(user: User) {
    return Object.values(this.teams).some((team) =>
      team.some((u, i) => u.id === user.id && i === 0),
    )
  }

  public async addUser(user: User) {
    const wasBelowCount = !this.isAboveCount

    if (!this.isUserInDraft(user)) {
      this.users = [...this.users, user]

      this.nicknames[user.id] = await this.getNickname(user)

      await this.updateEmbedMessage()

      if (wasBelowCount && this.isAboveCount) {
        const content = `The draft has enough players to begin, please hit "Ready" within the next ${this.readyWaitTime} minutes or be moved to the back of the queue.`

        setTimeout(() => {
          this.usersInCount.forEach((u) => {
            if (!this.readyUsers.includes(u.id)) {
              this.moveUserToBackOfQueue(user)
            }
          })
        }, 5000)

        this.sendSignupPing(content)
      } else if (this.needsOneMorePlayer) {
        const content = `Draft is close to filling (${this.count - 1}/${this.count}) Join now!`

        this.sendSignupPing(content)
      }
    }
  }

  public async removeUser(user: User) {
    const wasAboveCount = this.isAboveCount

    this.users = this.users.filter((u) => u.id !== user.id)

    this.readyUsers = this.readyUsers.filter((id) => id != user.id)

    Object.keys(this.teams).forEach((key) => this.removeUserFromTeam(user, parseInt(key, 10)))

    if (this.needsOneMorePlayer) {
      const content = `Draft is close to filling (${this.count - 1}/${this.count}) Join now!`

      this.sendSignupPing(content)
    } else if (wasAboveCount) {
      this.usersInCount[this.usersInCount.length - 1]?.send(
        `You are now in the draft count, please be ready within ${this.readyWaitTime} minutes`,
      )
    }

    await this.updateEmbedMessage()
  }

  public async reorderUser(user: User, position: number) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.splice(position, 0, user)

    await this.updateEmbedMessage()
  }

  public async setTeamCaptain(user: User, team: number) {
    if (this.isUserInCount(user)) {
      this.teams[team]?.unshift(user)
    }

    await this.updateEmbedMessage()
  }

  public async addUserToTeam(user: User, team: number) {
    if (this.isUserInCount(user) && !this.isUserOnTeam(user, team)) {
      this.teams[team]?.push(user)
    }

    await this.updateEmbedMessage()
  }

  public async removeUserFromTeam(user: User, team: number) {
    this.teams[team] = this.teams[team]?.filter((u) => u.id !== user.id) ?? []

    await this.updateEmbedMessage()
  }

  public async swapUserTeam(user: User) {
    if (this.isUserOnTeam(user, 1)) {
      this.removeUserFromTeam(user, 1)
      this.addUserToTeam(user, 2)
    } else if (this.isUserOnTeam(user, 2)) {
      this.removeUserFromTeam(user, 2)
      this.addUserToTeam(user, 1)
    }

    await this.updateEmbedMessage()
  }

  public async addUserToCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 1)) {
      this.addUserToTeam(user, 1)
    } else if (this.isUserOnTeam(captain, 2)) {
      this.addUserToTeam(user, 2)
    }

    await this.updateEmbedMessage()
  }

  public async removeUserFromCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 1)) {
      this.removeUserFromTeam(user, 1)
    } else if (this.isUserOnTeam(captain, 2)) {
      this.removeUserFromTeam(user, 2)
    }

    await this.updateEmbedMessage()
  }

  // for hydrating a persisted draft
  public async addUsers(users: (User | undefined)[]) {
    for (const user of users) {
      if (user && !this.isUserInDraft(user)) {
        this.users = [...this.users, user]

        this.nicknames[user.id] = await this.getNickname(user)
      }
    }

    await this.updateEmbedMessage()
  }

  public async cancel(canceler: User) {
    const message = await this.getMessage(this.embedMessageId)

    const signupMessage = await this.getMessage(this.signupMessageId)

    if (message?.editable) {
      message.edit({
        content: `~~<@${this.hostId}> has started a draft~~\n\nDraft has been canceled by <@${canceler.id}>`,
        embeds: [],
        components: [],
      })
    }

    if (signupMessage?.deletable) {
      await signupMessage.delete()
    }

    this.canceled = true

    this.save()

    setTimeout(() => {
      if (message?.deletable) {
        message.delete()
      }
    }, 10000)
  }

  public async save() {
    const doc = serializeDraft(this)

    try {
      await drafts.doc(this.guildId).set(doc, { merge: true })
    } catch (e) {
      console.log('Draft failed to save')
      console.log(e)
    }
  }

  public async start() {
    this.readyUsers = []

    await this.updateEmbedMessage()
  }
}
