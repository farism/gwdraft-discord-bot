import {
  addMilliseconds,
  differenceInMilliseconds,
  formatDuration,
  intervalToDuration,
  isBefore,
  minutesToMilliseconds,
} from 'date-fns'
import { CommandInteraction, User } from 'discord.js'
import table from 'text-table'
import { addLossToPlayer, addWinToPlayer, getGuildSettings } from '../../firebase'
import { userHasRole } from '../permissions'
import { Draft } from './draft'
import { addDraft, getDraft, removeDraft } from './registry'

const winnerWaitTime = 3 * 60 * 1000

const winnerTimestamps: { [k: string]: Date } = {}

export async function handleDraftCreate(i: CommandInteraction) {
  if (getDraft(i)) {
    i.reply({
      content: 'Active draft already exists. You need to cancel it first.',
      ephemeral: true,
    })

    return
  }

  const guildSettings = await getGuildSettings(i.guildId)

  const hasRole = guildSettings?.draft_moderator_role
    ? userHasRole(i.guild, i.user.id, guildSettings?.draft_moderator_role || '')
    : true

  const isInDraftChannel = guildSettings?.draft_channel
    ? guildSettings.draft_channel === i.channel?.id
    : true

  if (!hasRole) {
    await i.reply({
      content: `You do not have the <@&${guildSettings?.draft_moderator_role}> role`,
      ephemeral: true,
    })
  } else if (!isInDraftChannel) {
    await i.reply({
      content: `Invalid channel, please use <#${guildSettings?.draft_channel}>`,
      ephemeral: true,
    })
  } else {
    const time = i.options.getString('time')
    const location = i.options.getString('location') || 'Great Temple of Balthazar - AE1'
    const count = i.options.getInteger('count') || 16
    const description = i.options.getString('description') || ''
    const skipSignupPing = i.options.getBoolean('skip_signup_ping') || false

    if (i.guildId) {
      try {
        await i.deferReply({ ephemeral: true })

        const draft = new Draft({
          channelId: i.channelId,
          count,
          description,
          guildId: i.guildId,
          hostId: i.user.id,
          location,
          skipSignupPing,
          time,
          interaction: i, // TODO can we remove this ref?
        })

        addDraft(draft)

        await draft.initializeNewDraft()

        await i.editReply({ content: 'Draft created' })
      } catch (e) {
        console.log(e)
      }
    }
  }
}

export async function handleDraftAddPlayers(i: CommandInteraction) {
  const users = [
    i.options.getUser('user1'),
    i.options.getUser('user2'),
    i.options.getUser('user3'),
    i.options.getUser('user4'),
    i.options.getUser('user5'),
  ].filter((u) => u)

  getDraft(i)?.addUsers(...(users as User[]))

  await i.reply({ content: `Player${users.length === 1 ? '' : 's'} added`, ephemeral: true })
}

export async function handleDraftRemovePlayers(i: CommandInteraction) {
  const users = [
    i.options.getUser('user1'),
    i.options.getUser('user2'),
    i.options.getUser('user3'),
    i.options.getUser('user4'),
    i.options.getUser('user5'),
  ].filter((u) => u)

  getDraft(i)?.removeUsers(...(users as User[]))

  await i.reply({ content: `Player${users.length === 1 ? '' : 's'} removed`, ephemeral: true })
}

export async function handleDraftReorderPlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  const position = i.options.getInteger('position', true)

  getDraft(i)?.reorderUser(user, position)

  await i.reply({ content: `Player moved`, ephemeral: true })
}

export async function handleDraftWinner(i: CommandInteraction) {
  const draft = getDraft(i)

  if (!i.guildId) {
    i.reply({ content: 'Invalid guild id', ephemeral: true })
  } else if (!draft) {
    i.reply({ content: 'There is no active draft', ephemeral: true })
  } else if (
    winnerTimestamps[i.guildId] &&
    isBefore(new Date(), addMilliseconds(winnerTimestamps[i.guildId], winnerWaitTime))
  ) {
    i.reply({ content: 'A winner has been declared recently, please wait', ephemeral: true })
  } else {
    const team = i.options.getInteger('team', true)

    if (team === 1) {
      draft.teams[1].forEach((u) => addWinToPlayer(u.id))
      draft.teams[2].forEach((u) => addLossToPlayer(u.id))
    } else if (team === 2) {
      draft.teams[1].forEach((u) => addLossToPlayer(u.id))
      draft.teams[2].forEach((u) => addWinToPlayer(u.id))
    }

    if (i.guildId) {
      winnerTimestamps[i.guildId] = new Date()
    }

    await i.reply({ content: `Team ${team} declared the winner!` })

    setTimeout(() => {
      i.deleteReply()
    }, winnerWaitTime)
  }
}

export async function handleDraftEdit(i: CommandInteraction) {
  const draft = getDraft(i)

  await draft?.edit(
    i.options.getUser('host'),
    i.options.getString('location'),
    i.options.getString('description'),
  )

  await i.reply({ content: `Draft edited`, ephemeral: true })
}

export async function handleDraftCancel(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    try {
      await draft.cancel()
    } catch (e) {
      console.log(e)
    }

    await removeDraft(draft)

    const draftDuration = intervalToDuration({
      start: 0,
      end: differenceInMilliseconds(new Date(), draft.date),
    })

    function format(d: Duration): string {
      return `${d.hours}:${(d.minutes || 0) < 10 ? '0' : ''}${d.minutes}`
    }

    const content = [`Draft has been canceled after ${formatDuration(draftDuration)}`]

    if (draft.usersLog.length > 0) {
      const log = draft.usersLog.map((u, i) => {
        return [
          `${i + 1}.`,
          u.nickname || u.username,
          format(intervalToDuration({ start: 0, end: u.durationInDraft })),
          format(intervalToDuration({ start: 0, end: u.durationInCount })),
          `${((u.durationInCount / u.durationInDraft) * 100).toFixed(0)}%`,
        ]
      })

      const t = table([
        ['', 'Name', 'In Draft', 'In Count', '% In Count'],
        ['', '', '', '', ''],
        ...log,
      ])

      content.push('The following players joined the draft:')

      content.push('```' + t + '```')
    }

    await i.reply({ content: content.join('\n\n') })

    const ic = i
    setTimeout(() => ic.deleteReply().catch((e) => console.log(e)), minutesToMilliseconds(60))
  } else {
    await i.reply({ content: `There is no active draft to cancel`, ephemeral: true })
  }
}
