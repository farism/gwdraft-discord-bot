import {
  addDays,
  differenceInMilliseconds,
  format,
  formatDuration,
  intervalToDuration,
  isAfter,
  subHours,
} from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'
import {
  CommandInteraction,
  Guild,
  GuildBasedChannel,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  User,
} from 'discord.js'
import { client } from '../../client'
import { drafts, getGuildSettings, players, Settings } from '../../firebase'
import { allFlux, defaultPlayerCount } from '../../helpers/constants'
import { parseTime } from '../../helpers/time'
import { GuildId } from '../../types'
import { userHasRole } from '../helpers'

const draftIds: { [k: GuildId]: number } = {}

function nextDraftId(guildId: string) {
  if (draftIds[guildId] !== undefined) {
    draftIds[guildId] = draftIds[guildId] + 1
  } else {
    draftIds[guildId] = 0
  }

  return draftIds[guildId]
}

interface DraftOptions {
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

export class Draft {
  // options
  channelId: string
  count: number
  description: string | null
  guildId: string
  hostId: string
  id: number
  location: string
  readyWaitTime: number
  skipSignupPing: boolean
  time: string | null

  // state
  canceled: boolean = false
  date: Date = new Date()
  hasSentSignupPing: boolean = false
  messageId: string | null = null
  readyUsers: string[] = []
  settings: Settings | null = null
  signupMessageId: string | null = null
  teams: { [k: number]: User[] } = {
    1: [],
    2: [],
  }
  timerNotify: NodeJS.Timer
  timerUpdate: NodeJS.Timer
  users: User[] = []
  usersNotifiedOfCount: string[] = []
  usersNotifiedOfReady: string[] = []

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

    this.interaction = interaction

    this.channelId = channelId
    this.count = count
    this.date = date
    this.description = description
    this.guildId = guildId
    this.hostId = hostId
    this.id = nextDraftId(guildId || '')
    this.location = location
    this.readyWaitTime = readyWaitTime
    this.skipSignupPing = skipSignupPing
    this.time = time
    this.timerNotify = setInterval(() => {
      this.sendSignupPingToChannel()
      this.dmUsers()
    }, 1000)
    this.timerUpdate = setInterval(() => {
      // this.update()
    }, 5000)
  }

  get guild(): Guild | undefined {
    return client.guilds.cache.get(this.guildId)
  }

  get channel(): GuildBasedChannel | undefined {
    const channel = this.guild?.channels.cache.get(this.channelId)

    if (channel?.isText) {
      return channel
    }
  }

  get signupDate() {
    return subHours(this.date, 1)
  }

  get isPastStartTime() {
    return new Date() > this.date
  }

  get hasAboveCount() {
    return this.usersInCount.length >= this.count
  }

  get canIndicateReady() {
    return this.isPastStartTime && this.hasAboveCount
  }

  get allUsersReadyInCount() {
    return this.usersInCount.filter((u) => this.readyUsers.includes(u.id)).length === this.count
  }

  get usersInCount() {
    return this.users.slice(0, this.count)
  }

  get countdown() {
    if (isAfter(new Date(), this.signupDate)) {
      return 0
    }

    return Math.abs(differenceInMilliseconds(new Date(), this.signupDate))
  }

  get countdownFormatted() {
    const duration = intervalToDuration({ start: 0, end: this.countdown })

    const format = duration.hours || duration.minutes ? ['hours', 'minutes'] : ['seconds']

    return formatDuration(duration, {
      zero: true,
      format,
    })
  }

  formatReady(user: User) {
    return this.readyUsers.find((id) => id === user.id) ? '✓ ' : ''
  }

  canUserSignup(user: User) {
    return this.isUserTheHost(user) || new Date() > this.signupDate
  }

  isUserNotifiedOfCount(user: User) {
    return this.usersNotifiedOfCount.includes(user.id)
  }

  isUserNotifiedOReady(user: User) {
    return this.usersNotifiedOfReady.includes(user.id)
  }

  isUserTheHost(user: User) {
    return this.hostId === user.id
  }

  isUserInDraft(user: User) {
    return this.users.findIndex((u) => u.id === user.id) >= 0
  }

  isUserInCount(user: User) {
    return !!this.usersInCount.find((u) => u.id === user.id)
  }

  isUserOnTeam(user: User, team: number) {
    return !!this.teams[team]?.find((u) => u.id === user.id)
  }

  isUserModerator(user: User) {
    if (this.guild) {
      return userHasRole(this.guild, user, this.settings?.draft_moderator_role || '')
    }

    return false
  }

  isUserCaptain(user: User) {
    return Object.values(this.teams).some((team) =>
      team.some((u, i) => u.id === user.id && i === 0),
    )
  }

  isUserReady(user: User) {
    return this.readyUsers.includes(user.id)
  }

  async getMessage(id: string | null) {
    const guild = await client.guilds.fetch(this.guildId)

    const channel = await guild.channels.fetch(this.channelId)

    if (channel?.isText() && id) {
      return await channel.messages.fetch(id, { force: true })
    }
  }

  async sendInitialMessage() {
    if (!this.channel?.isText()) {
      throw new Error('Draft must be created in a text channel')
    }

    this.settings = await getGuildSettings(this.guildId)

    const embed = await this.createEmbed()

    const message = await this.channel.send({
      content: `A draft has been ${this.time ? 'scheduled' : 'created'}`,
      embeds: [embed],
      components: [this.createComponents()],
    })

    if (message) {
      this.messageId = message.id

      this.collectInteractions()
    }
  }

  async collectInteractions() {
    const message = await this.getMessage(this.messageId)

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

      await this.save()
    }
  }

  async update() {
    try {
      const message = await this.getMessage(this.messageId)

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
      await this.save()
    } catch (e) {
      console.log('Save after update failed')
      console.log(e)
    }
  }

  createComponents() {
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
        .setStyle(this.countdown > 0 ? 'SECONDARY' : 'PRIMARY')
        .setDisabled(this.countdown > 0),
      new MessageButton()
        .setCustomId('leave')
        .setLabel('Leave')
        .setStyle('SECONDARY')
        .setDisabled(this.countdown > 0),
    )

    return row
  }

  async createEmbed() {
    const time = Math.floor(this.date.getTime() / 1000)

    const month = format(new Date(), 'MMMM')

    const flux = allFlux[this.date.getMonth()]

    const divider = (i: number) => (i === this.count ? '-----\n' : '')

    const signups: string[] = []

    for (const [i, user] of this.users.entries()) {
      const doc = await (await players.doc(user.id).get()).data()

      const ign = doc?.ign ? ` (${doc.ign})` : ''

      signups.push(`${divider(i)}${i + 1}. ${this.formatReady(user)}${user.username}${ign}`)
    }

    const embed = new MessageEmbed()

    embed.addField('Start Time', this.isPastStartTime ? 'In Progress' : `<t:${time}>`)

    if (this.countdown > 0) {
      embed.addField('Sign-ups Start In', this.countdownFormatted)
    }

    embed.addField('Meeting Location', this.location)

    if (this.description) {
      embed.addField('Description', this.description)
    }

    embed
      .addField('Player Count', String(this.count))
      // .addField(`${month} Flux - ${flux.name}`, `${flux.description} [wiki](${flux.link})`)
      .addField('Host', `<@${this.hostId}>`)
      .addField('\u200b', '-'.repeat(90))
      .addField('Signups', `${signups.length ? signups.join('\n') : 'None'}`)

    Object.values(this.teams).forEach((team, i) => {
      const t = team.map((u, i) => `${i + 1}. ${u.username}`).join('\n') || 'None'
      embed.addField(`Team ${i + 1}`, t, true)
    })

    return embed
  }

  async addUser(user: User) {
    if (!this.isUserInDraft(user)) {
      this.users = [...this.users, user]

      await this.update()
    }
  }

  async removeUser(user: User) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.readyUsers = this.readyUsers.filter((id) => id != user.id)

    Object.keys(this.teams).forEach((key) => this.removeUserFromTeam(user, parseInt(key, 10)))

    await this.update()
  }

  async reorderUser(user: User, position: number) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.splice(position, 0, user)

    await this.update()
  }

  async setTeamCaptain(user: User, team: number) {
    if (this.isUserInCount(user)) {
      this.teams[team]?.unshift(user)
    }

    await this.update()
  }

  async addUserToTeam(user: User, team: number) {
    if (this.isUserInCount(user) && !this.isUserOnTeam(user, team)) {
      this.teams[team]?.push(user)
    }

    await this.update()
  }

  async removeUserFromTeam(user: User, team: number) {
    this.teams[team] = this.teams[team]?.filter((u) => u.id !== user.id) ?? []

    await this.update()
  }

  async moveUserToBackOfQueue(user: User) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.push(user)

    await this.update()
  }

  async swapUserTeam(user: User) {
    if (this.isUserOnTeam(user, 1)) {
      this.removeUserFromTeam(user, 1)
      this.addUserToTeam(user, 2)
    } else if (this.isUserOnTeam(user, 2)) {
      this.removeUserFromTeam(user, 2)
      this.addUserToTeam(user, 1)
    }

    await this.update()
  }

  async addUserToCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 1)) {
      this.addUserToTeam(user, 1)
    } else if (this.isUserOnTeam(captain, 2)) {
      this.addUserToTeam(user, 2)
    }

    await this.update()
  }

  async removeUserFromCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 1)) {
      this.removeUserFromTeam(user, 1)
    } else if (this.isUserOnTeam(captain, 2)) {
      this.removeUserFromTeam(user, 2)
    }

    await this.update()
  }

  async toggleReady(user: User) {
    if (this.readyUsers.includes(user.id)) {
      this.readyUsers = this.readyUsers.filter((id) => id !== user.id)
    } else {
      this.readyUsers = [...this.readyUsers, user.id]
    }

    await this.update()
  }

  async sendSignupPingToChannel() {
    if (
      this.skipSignupPing ||
      !this.settings?.draft_player_role ||
      this.countdown > 0 ||
      this.hasSentSignupPing
    ) {
      return
    }

    this.hasSentSignupPing = true

    const message = await this.getMessage(this.messageId)

    try {
      const signupMsg = await message?.channel.send(
        `Draft starting, sign up now! <@&${this.settings.draft_player_role}>`,
      )

      this.signupMessageId = signupMsg?.id || null

      this.save()
    } catch (e) {
      console.log(`Failed to send signup notification message to channel ${message?.channel.id}`)
      console.log(e)
    }
  }

  async notifyCountHasFilled() {
    const users = this.usersInCount.filter((u) => !this.isUserNotifiedOReady(u))

    users.forEach((u) => this.usersNotifiedOfReady.push(u.id))

    for (let user of users) {
      try {
        await user
          .send(
            [`The players in the draft count are all ready, please meet in ${this.location}`].join(
              '\n\n',
            ),
          )
          .then((m) => setTimeout(() => m.delete(), 5 * 60 * 1000))
      } catch (e) {
        console.log(`Failed to send all ready DM to ${user.username}`)
        console.log(e)
      }
    }
  }

  async notifyAllPlayersAreReady() {
    const users = this.usersInCount.filter((u) => !this.isUserNotifiedOfCount(u))

    users.forEach((u) => this.usersNotifiedOfCount.push(u.id))

    for (let user of users) {
      try {
        await user
          .send(
            [`The draft has enough players, please indicate if you are ready to play`].join('\n\n'),
          )
          .then((m) => setTimeout(() => m.delete(), 5 * 60 * 1000))
      } catch (e) {
        console.log(`Failed to send ready check DM to ${user.username}`)
        console.log(e)
      }

      setTimeout(() => {
        if (!this.isUserReady(user) && this.usersInCount.length > this.count) {
          this.moveUserToBackOfQueue(user)
        }
      }, this.readyWaitTime * 60 * 1000)
    }
  }

  async dmUsers() {
    const prevUsersNotifiedOfCount = this.usersNotifiedOfCount.length
    const prevUsersNotifiedOfReady = this.usersNotifiedOfReady.length

    try {
      if (this.hasAboveCount && this.allUsersReadyInCount) {
        await this.notifyAllPlayersAreReady()
      } else if (this.isPastStartTime && this.hasAboveCount) {
        await this.notifyCountHasFilled()
      }
    } catch (e) {}

    if (
      prevUsersNotifiedOfCount !== this.usersNotifiedOfCount.length ||
      prevUsersNotifiedOfReady !== this.usersNotifiedOfReady.length
    ) {
      this.save()
    }
  }

  async cancel(canceler: User) {
    clearInterval(this.timerNotify)
    clearInterval(this.timerUpdate)

    const message = await this.getMessage(this.messageId)

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
  }

  async save() {
    const doc = {
      channelId: this.channelId,
      count: this.count,
      description: this.description,
      guildId: this.guildId,
      hostId: this.hostId,
      location: this.location,
      readyWaitTime: this.readyWaitTime,
      skipSignupPing: this.skipSignupPing,
      time: this.time,

      canceled: this.canceled,
      date: this.date,
      hasSentSignupPing: this.hasSentSignupPing,
      messageId: this.messageId,
      readyUsers: this.readyUsers,
      signupMessageId: this.signupMessageId,
      teams: Object.entries(this.teams).reduce(
        (acc, [key, users]) => ({ ...acc, [key]: users.map((u) => u.id) }),
        {} as { [k: string]: string[] },
      ),
      users: this.users.map((u) => u.id),
      usersNotifiedOfCount: this.usersNotifiedOfCount,
      usersNotifiedOfReady: this.usersNotifiedOfReady,
    }
    q
    try {
      await drafts.doc(this.guildId).set(doc, { merge: true })
    } catch (e) {
      console.log('Draft failed to save')
      console.log(e)
    }
  }

  async hydrateUsers(users: string[]) {
    const members = await this.guild?.members.fetch({ user: users })

    users.forEach((id) => {
      const member = members?.find((u) => u.id === id)
      if (member) {
        this.users.push(member.user)
      }
    })
  }

  async hydrateTeams(teams: { [k: string]: string[] }) {
    for (let [key, users] of Object.entries(teams)) {
      const members = await this.guild?.members.fetch({ user: users })

      members?.forEach((m) => {
        const team = this.teams[parseInt(key, 10)]

        if (team) {
          team.push(m.user)
        }
      })
    }
  }

  async start() {
    this.readyUsers = []

    await this.update()
  }
}
