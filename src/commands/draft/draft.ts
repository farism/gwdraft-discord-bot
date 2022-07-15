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
import { defaultPlayerCount, allFlux } from '../../helpers/constants'
import { parseTime } from '../../helpers/time'
import { GuildId } from '../../types'

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
  signupMessage?: Message
  usersNotifiedOfCount: string[] = []
  usersNotifiedOfReady: string[] = []
  timer: NodeJS.Timer
  timerUpdate: NodeJS.Timer
  users: User[] = []
  readyUsers: string[] = []

  constructor(interaction: CommandInteraction) {
    const time = interaction.options.getString('time')
    const location = interaction.options.getString('location') || 'Great Temple of Balthazar - AE1'
    const count = interaction.options.getInteger('count') ?? defaultPlayerCount
    const description = interaction.options.getString('description')

    const now = new Date()
    let date = time ? zonedTimeToUtc(parseTime(time), 'Europe/Paris') : now
    if (date < now) {
      date = addDays(date, 1)
    }

    this.interaction = interaction
    this.date = date
    this.location = location
    this.count = count
    this.description = description
    this.id = nextDraftId(interaction.guildId || '')
    this.host = interaction.user
    this.timer = setInterval(() => {
      this.notifySignup()
      this.notifyUsers()
    }, 1000)
    this.timerUpdate = setInterval(() => this.updateMessage(), 5000)
    this.setupMessage()
  }

  get signupDate() {
    return subHours(this.date, 1)
  }

  get hasStarted() {
    return new Date() > this.date
  }

  get hasReachedCount() {
    return this.usersInCount.length >= this.count
  }

  get allInCountReady() {
    return this.usersInCount.filter((u) => this.readyUsers.includes(u.id)).length === this.count
  }

  get canIndicateReady() {
    return this.hasStarted && this.hasReachedCount
  }

  get shouldCommence() {
    return this.hasStarted && this.hasReachedCount && this.allInCountReady
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

  async setupMessage() {
    const message = await this.interaction.channel?.send({
      embeds: [this.createEmbed()],
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
          this.setReady(i.user)

          i.reply({ content: 'You have indicated you are ready to play', ephemeral: true })
        }
      })

      this.message = message
    }

    this.updateMessage()
  }

  async updateMessage() {
    try {
      await this.message?.edit({
        embeds: [this.createEmbed()],
        components: [this.createComponents()],
      })
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

  createEmbed() {
    const time = Math.floor(this.date.getTime() / 1000)

    const month = format(new Date(), 'MMMM')

    const flux = allFlux[this.date.getMonth()]

    const divider = (i: number) => (i === this.count ? '-----\n' : '')

    const signups =
      this.users.length === 0
        ? 'None'
        : this.users
            .map((user, i) => `${divider(i)}${i + 1}. <@${user.id}> ${this.formatReady(user)}`)
            .join('\n')

    const embed = new MessageEmbed()

    embed
      .setTitle(`Draft #${this.id}`)
      .addField('Start Time', this.hasStarted ? 'In Progress' : `<t:${time}>`)

    if (this.countdown > 0) {
      embed.addField('Sign-ups Start In', this.countdownFormatted)
    }

    embed.addField('Meeting Location', this.location)

    if (this.description) {
      embed.addField('Description', this.description)
    }

    embed
      .addField('Player Count', String(this.count))
      .addField(`${month} Flux - ${flux.name}`, `${flux.description} [wiki](${flux.link})`)
      .addField('Bans', `No bans`)
      .addField('Host', `<@${this.host.id}>`)
      .addField('Signups', `${signups}`)

    return embed
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

  async addUser(user: User) {
    if (!this.isUserInDraft(user)) {
      this.users = [...this.users, user]

      this.updateMessage()
    }
  }

  async removeUser(user: User) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.readyUsers = this.readyUsers.filter((id) => id != user.id)

    this.updateMessage()
  }

  async moveUser(user: User, position: number) {
    this.users = this.users.filter((u) => u.id !== user.id)

    this.users.splice(position, 0, user)

    this.updateMessage()
  }

  async setReady(user: User) {
    if (this.isUserInDraft(user)) {
      this.readyUsers = [...this.readyUsers, user.id]

      this.updateMessage()
    }
  }

  async notifySignup() {
    if (this.countdown > 0 || this.hasSentSignupPing) {
      return
    }

    this.hasSentSignupPing = true

    this.signupMessage = await this.message?.channel.send(
      `Draft starting, sign up now! <@&996939663598166086>`,
    )
  }

  async notifyUsers() {
    if (this.shouldCommence) {
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
    } else if (this.hasReachedCount) {
      this.usersInCount.forEach((u) => {
        if (!this.isUserNotifiedOfCount(u)) {
          this.usersNotifiedOfCount.push(u.id)

          u.send(
            [`The draft has enough players, please indicate if you are ready to play`].join('\n\n'),
          ).then((m) => setTimeout(() => m.delete(), 5 * 60 * 1000))
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
}
