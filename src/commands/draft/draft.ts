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
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  User,
} from 'discord.js'
import { getGuildSettings, players, Settings } from '../../firebase'
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

export class Draft {
  count: number
  date: Date
  description: string | null
  hasSentSignupPing: boolean = false
  host: User
  id: number
  interaction: CommandInteraction
  location: string
  message?: Message
  readyUsers: string[] = []
  readyWaitTime: number
  settings: Settings | null = null
  signupMessage?: Message
  teams: [User[], User[]] = [[], []]
  timer: NodeJS.Timer
  timerUpdate: NodeJS.Timer
  users: User[] = []
  usersNotifiedOfCount: string[] = []
  usersNotifiedOfReady: string[] = []

  constructor(i: CommandInteraction) {
    const time = i.options.getString('time')
    const location = i.options.getString('location') ?? 'Great Temple of Balthazar - AE1'
    const count = i.options.getInteger('count') ?? defaultPlayerCount
    const description = i.options.getString('description')
    const readyWaitTime = i.options.getInteger('ready_wait_time') ?? 5

    const now = new Date()
    let date = time ? zonedTimeToUtc(parseTime(time), 'Europe/Paris') : now
    if (date < now) {
      date = addDays(date, 1)
    }

    this.count = count
    this.date = date
    this.description = description
    this.host = i.user
    this.id = nextDraftId(i.guildId || '')
    this.interaction = i
    this.location = location
    this.readyWaitTime = readyWaitTime
    this.timer = setInterval(() => {
      this.notifySignup()
      this.notifyUsers()
    }, 1000)
    this.timerUpdate = setInterval(() => this.updateMessage(), 5000)
    this.initialize()
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

  get allReady() {
    return this.usersInCount.filter((u) => this.readyUsers.includes(u.id)).length === this.count
  }

  get canIndicateReady() {
    return this.isPastStartTime && this.hasAboveCount
  }

  get shouldStart() {
    return this.isPastStartTime && this.hasAboveCount && this.allReady
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
    return this.readyUsers.find((id) => id === user.id) ? ' ✓' : ''
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
    return this.host.id === user.id
  }

  isUserInDraft(user: User) {
    return this.users.findIndex((u) => u.id === user.id) >= 0
  }

  isUserInCount(user: User) {
    return !!this.usersInCount.find((u) => u.id === user.id)
  }

  isUserOnTeam(user: User, team: number) {
    return !!this.teams[team].find((u) => u.id === user.id)
  }

  isUserModerator(user: User) {
    return userHasRole(this.interaction.guild, user, this.settings?.draft_moderator_role || '')
  }

  isUserCaptain(user: User) {
    return this.teams[0][0]?.id === user.id || this.teams[1][0]?.id === user.id
  }

  isUserReady(user: User) {
    return this.readyUsers.includes(user.id)
  }

  async initialize() {
    this.settings = await getGuildSettings(this.interaction)

    const embed = await this.createEmbed()

    const message = await this.interaction.channel?.send({
      embeds: [embed],
      components: [this.createComponents()],
    })

    if (message) {
      const collector = message.createMessageComponentCollector({
        dispose: true,
        time: 24 * 60 * 60 * 1000,
      })

      collector.on('collect', async (i) => {
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

      this.message = message
    }

    this.updateMessage()
  }

  async updateMessage() {
    try {
      if (this.message?.editable) {
        const embed = await this.createEmbed()

        await this.message?.edit({
          embeds: [embed],
          components: [this.createComponents()],
        })
      }
    } catch (e) {
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

      signups.push(`${divider(i)}${i + 1}. <@${user.id}> ${this.formatReady(user)}${ign}`)
    }

    const embed = new MessageEmbed()

    embed
      .setTitle(`Draft #${this.id}`)
      .addField('Start Time', this.isPastStartTime ? 'In Progress' : `<t:${time}>`)

    if (this.countdown > 0) {
      embed.addField('Sign-ups Start In', this.countdownFormatted)
    }

    embed.addField('Meeting Location', this.location)

    if (this.description) {
      embed.addField('Description', this.description)
    }

    const team1 = this.teams[0].map((u, i) => `${i + 1}. ${u.username}`).join('\n') || 'None'

    const team2 = this.teams[1].map((u, i) => `${i + 1}. ${u.username}`).join('\n') || 'None'

    embed
      .addField('Player Count', String(this.count))
      .addField(`${month} Flux - ${flux.name}`, `${flux.description} [wiki](${flux.link})`)
      .addField('Host', `<@${this.host.id}>`)
      .addField('Signups', `${signups.length ? signups.join('\n') : 'None'}`)
      .addField('Team 1', team1, true)
      .addField('Team 2', team2, true)

    return embed
  }

  async addUser(user: User) {
    if (!this.isUserInDraft(user)) {
      this.users = [...this.users, user]

      this.updateMessage()
    }
  }

  async removeUser(user: User) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.readyUsers = this.readyUsers.filter((id) => id != user.id)

    this.removeUserFromTeam(user, 0)

    this.removeUserFromTeam(user, 1)

    this.updateMessage()
  }

  async reorderUser(user: User, position: number) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.splice(position, 0, user)

    this.updateMessage()
  }

  async setTeamCaptain(user: User, team: number) {
    if (this.isUserInCount(user)) {
      this.teams[team].unshift(user)
    }

    this.updateMessage()
  }

  async addUserToTeam(user: User, team: number) {
    if (this.isUserInCount(user) && !this.isUserOnTeam(user, team)) {
      this.teams[team].push(user)
    }

    this.updateMessage()
  }

  async removeUserFromTeam(user: User, team: number) {
    this.teams[team] = this.teams[team].filter((u) => u.id !== user.id)

    this.updateMessage()
  }

  async moveUserToBackOfQueue(user: User) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.push(user)

    this.updateMessage()
  }

  async swapUserTeam(user: User) {
    if (this.isUserOnTeam(user, 0)) {
      this.removeUserFromTeam(user, 0)
      this.addUserToTeam(user, 1)
    } else if (this.isUserOnTeam(user, 1)) {
      this.removeUserFromTeam(user, 1)
      this.addUserToTeam(user, 0)
    }

    this.updateMessage()
  }

  async addUserToCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 0)) {
      this.addUserToTeam(user, 0)
    } else if (this.isUserOnTeam(captain, 1)) {
      this.addUserToTeam(user, 1)
    }

    this.updateMessage()
  }

  async removeUserFromCaptainsTeam(captain: User, user: User) {
    if (this.isUserOnTeam(captain, 0)) {
      this.removeUserFromTeam(user, 0)
    } else if (this.isUserOnTeam(captain, 1)) {
      this.removeUserFromTeam(user, 1)
    }

    this.updateMessage()
  }

  async toggleReady(user: User) {
    if (this.readyUsers.includes(user.id)) {
      this.readyUsers = this.readyUsers.filter((id) => id !== user.id)
    } else {
      this.readyUsers = [...this.readyUsers, user.id]
    }

    this.updateMessage()
  }

  async notifySignup() {
    if (this.countdown > 0 || this.hasSentSignupPing) {
      return
    }

    if (this.settings?.draft_player_role) {
      this.signupMessage = await this.message?.channel.send(
        `Draft starting, sign up now! <@&${this.settings.draft_player_role}>`,
      )

      this.hasSentSignupPing = true
    }
  }

  async notifyUsers() {
    if (this.shouldStart) {
      this.usersInCount.forEach((u) => {
        if (!this.isUserNotifiedOReady(u)) {
          this.usersNotifiedOfReady.push(u.id)

          u.send(
            [`The players in the draft count are all ready, please meet in ${this.location}`].join(
              '\n\n',
            ),
          ).then((m) => setTimeout(() => m.delete(), 5 * 60 * 1000))
        }
      })
    } else if (this.isPastStartTime && this.hasAboveCount) {
      this.usersInCount.forEach((u) => {
        if (!this.isUserNotifiedOfCount(u)) {
          this.usersNotifiedOfCount.push(u.id)

          u.send(
            [`The draft has enough players, please indicate if you are ready to play`].join('\n\n'),
          ).then((m) => setTimeout(() => m.delete(), 5 * 60 * 1000))

          setTimeout(() => {
            if (!this.isUserReady(u) && this.usersInCount.length > this.count) {
              this.moveUserToBackOfQueue(u)
            }
          }, this.readyWaitTime * 60 * 1000)
        }
      })
    }
  }

  async cancel(canceler: User) {
    clearInterval(this.timer)
    clearInterval(this.timerUpdate)

    await this.interaction.editReply({
      content: `~~<@${this.interaction.user.id}> has started a draft~~\n\nDraft #${this.id} has been canceled by <@${canceler.id}>`,
    })

    await this.signupMessage?.delete()

    await this.message?.delete()
  }

  async start() {
    this.readyUsers = []

    this.updateMessage()
  }
}
