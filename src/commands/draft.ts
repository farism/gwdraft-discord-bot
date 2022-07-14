import { SlashCommandBuilder } from '@discordjs/builders'
import {
  addDays,
  differenceInMilliseconds,
  format,
  formatDuration,
  intervalToDuration,
  isAfter,
  isMatch,
  parse,
  subHours,
} from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'
import {
  CacheType,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  User,
} from 'discord.js'
import { FLUX } from '../constants'
import { GuildId, Profession, ProfessionEmojiIds } from '../types'
import { getDraft, getUser } from './helpers'

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
  notifiedUsers: string[] = []
  timerNotify: NodeJS.Timer
  timerUpdate: NodeJS.Timer
  users: User[] = []

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
    this.timerNotify = setInterval(() => {
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
    return new MessageActionRow().addComponents(
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
  }

  createEmbed() {
    const time = Math.floor(this.date.getTime() / 1000)

    const month = format(new Date(), 'MMMM')

    const flux = FLUX[this.date.getMonth()]

    const divider = (i: number) => (i === this.count ? '-----\n' : '')

    const signups =
      this.users.length === 0
        ? 'None'
        : this.users.map((user, i) => `${divider(i)}${i + 1}. <@${user.id}>`).join('\n')

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

    if (this.count !== defaultPlayerCount) {
      embed.addField('Player Count', String(this.count))
    }

    embed
      .addField(`${month} Flux - ${flux.name}`, `${flux.description} [wiki](${flux.link})`)
      .addField('Bans', `No bans`)
      .addField('Host', `<@${this.host.id}>`)
      .addField('Signups', `${signups}`)

    return embed
  }

  canUserSignup(user: User) {
    return this.isUserTheHost(user) || new Date() > this.signupDate
  }

  hasReachedCount() {
    return this.usersInCount().length >= this.count
  }

  usersInCount() {
    return this.users.slice(0, this.count)
  }

  isUserNotified(user: User) {
    return this.notifiedUsers.includes(user.id)
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

    this.updateMessage()
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
    if (!this.hasReachedCount() || new Date() < this.date) {
      return
    }

    this.usersInCount().forEach((u) => {
      if (!this.isUserNotified(u)) {
        this.notifiedUsers.push(u.id)

        u.send([`The draft has enough players, please meet in ${this.location}`].join('\n\n')).then(
          (m) => setTimeout(() => m.delete(), 5 * 60 * 1000),
        )
      }
    })
  }

  async cancel(canceler: User) {
    clearInterval(this.timerNotify)
    clearInterval(this.timerUpdate)

    await this.interaction.editReply({
      content: `~~<@${this.interaction.user.id}> has started a draft~~\n\nDraft #${this.id} has been canceled by <@${canceler.id}>`,
    })

    await this.signupMessage?.delete()

    await this.message?.delete()
  }
}

const defaultPlayerCount = 16

const drafts: { [k: GuildId]: Draft } = {}

const allProfessions = Object.values(Profession)

const professionEmojis: ProfessionEmojiIds = {
  Assassin: '991859233593249833',
  Dervish: '991801732864671754',
  Elementalist: '991801734634684446',
  Mesmer: '991801736329175151',
  Monk: '991801737616834570',
  Necromancer: '991801738896089098',
  Paragon: '991801740108234792',
  Ranger: '991801741601423562',
  Ritualist: '991801742725488690',
  Warrior: '991801744373854319',
}

export const draftCmd = new SlashCommandBuilder()
  .setName('draft')
  .setDescription(`Manage drafts`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('start')
      .setDescription('Start a draft now, or at the specified time')
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('time')
          .setDescription('Starts the draft at the specified time in HH:mm format GMT+2 (e.g. "20:00")'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('location')
          .setDescription('The location where players should players meet in game (default = GToB AE1)'),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('count')
          .setDescription('How many players are required to join the draft before starting (default = 16)'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('description')
          .setDescription('Adds a description to the draft'),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('removeplayer')
      .setDescription('Manually remove a player from the draft')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The use to remove')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('cancel').setDescription('Cancel the current draft'),
  )

function parseTime(s: string) {
  if (isMatch(s, 'HH:mm')) {
    return parse(s, 'HH:mm', new Date())
  } else if (isMatch(s, 'HH:mm:ss')) {
    return parse(s, 'HH:mm:ss', new Date())
  }

  return new Date()
}

export async function handleDraftStart(i: CommandInteraction<CacheType>) {
  if (!i.guildId) {
    i.reply({ content: 'Invalid guild id' })
    return
  }

  if (drafts[i.guildId]) {
    i.reply({ content: 'Active draft exists' })
    return
  }

  await i.reply({ content: `<@${i.user.id}> has started a draft` })

  drafts[i.guildId] = new Draft(i)
}

export async function handleDraftRemovePlayer(i: CommandInteraction<CacheType>) {
  const user = getUser(i)

  const draft = getDraft(i, drafts)

  if (draft) {
    draft.removeUser(user)
  }

  await i.reply({ content: `used /draft removeplayer` })
}

export async function handleDraftCancel(i: CommandInteraction<CacheType>) {
  if (!i.guildId) {
    return
  }

  const draft = drafts[i.guildId]

  if (draft) {
    try {
      await draft.cancel(i.user)
    } catch (e) {}

    delete drafts[i.guildId]

    await i.reply({ content: `Canceling draft`, ephemeral: true })
  } else {
    await i.reply({ content: `There is no active draft to cancel`, ephemeral: true })
  }
}
