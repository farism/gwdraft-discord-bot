import { addMilliseconds, isBefore } from 'date-fns'
import { CommandInteraction } from 'discord.js'
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
    ? userHasRole(i.guild, i.user, guildSettings?.draft_moderator_role || '')
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
    const readyWaitTime = i.options.getInteger('ready_wait_time') || 5
    const skipSignupPing = i.options.getBoolean('skip_signup_ping') || false

    if (i.guildId) {
      try {
        i.deferReply({ ephemeral: true })

        const draft = new Draft({
          channelId: i.channelId,
          count,
          description,
          guildId: i.guildId,
          hostId: i.user.id,
          location,
          readyWaitTime,
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

export async function handleDraftStart(i: CommandInteraction) {
  if (!getDraft(i)) {
    i.reply({ content: 'There is no active draft', ephemeral: true })
    return
  }

  getDraft(i)?.start()

  await i.reply({ content: 'Draft started', ephemeral: true })
}

export async function handleDraftAddPlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  getDraft(i)?.addUser(user)

  await i.reply({ content: `Player added`, ephemeral: true })
}

export async function handleDraftRemovePlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  getDraft(i)?.removeUser(user)

  await i.reply({ content: 'Player removed', ephemeral: true })
}

export async function handleDraftReorderPlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  const position = i.options.getInteger('position', true)

  getDraft(i)?.reorderUser(user, position + 1)

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

  if (draft) {
    const host = i.options.getUser('host')

    if (host) {
      draft.hostId = host.id
    }

    const location = i.options.getString('location')

    if (location) {
      draft.location = location
    }

    const description = i.options.getString('description')

    if (description) {
      draft.description = description
    }

    draft.updateEmbedMessage()
  }

  await i.reply({ content: `Draft edited`, ephemeral: true })
}

export async function handleDraftCancel(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    try {
      await draft.cancel(i.user)
    } catch (e) {
      console.log(e)
    }

    await removeDraft(draft)

    await i.reply({ content: `Draft canceled`, ephemeral: true })
  } else {
    await i.reply({ content: `There is no active draft to cancel`, ephemeral: true })
  }
}
