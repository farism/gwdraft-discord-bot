import { CommandInteraction } from 'discord.js'
import { addLossToPlayer, addWinToPlayer, getGuildSettings } from '../../firebase'
import { GuildId } from '../../types'
import { userHasRole } from '../helpers'
import { Draft } from './draft'

const drafts: { [k: GuildId]: Draft } = {}

export function addDraft(draft: Draft) {
  drafts[draft.guildId] = draft
}

export function getDraft(i: CommandInteraction) {
  if (i.guildId) {
    return drafts[i.guildId]
  }
}

export function removeDraft(draft: Draft) {
  delete drafts[draft.guildId]
}

export async function handleDraftCreate(i: CommandInteraction) {
  if (!i.guildId) {
    i.reply({ content: 'Invalid guild id', ephemeral: true })
    return
  }

  if (drafts[i.guildId]) {
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

        await draft.sendInitialMessage()

        drafts[i.guildId] = draft

        await i.editReply({ content: 'Draft created' })
      } catch (e) {
        console.log(e)
      }
    }
  }
}

export async function handleDraftStart(i: CommandInteraction) {
  if (!drafts[i.guildId || 0]) {
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

  getDraft(i)?.reorderUser(user, position)

  await i.reply({ content: `Player moved`, ephemeral: true })
}

export async function handleDraftWinner(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const team = i.options.getInteger('team', true)

    if (team === 1) {
      draft.teams[0].forEach((u) => addWinToPlayer(u.id))
      draft.teams[1].forEach((u) => addLossToPlayer(u.id))
    } else if (team === 2) {
      draft.teams[0].forEach((u) => addLossToPlayer(u.id))
      draft.teams[1].forEach((u) => addWinToPlayer(u.id))
    }

    await i.reply({ content: `Team ${team} declared the winner!` })
  } else {
    i.reply({ content: 'There is no active draft' })
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

    if (draft.guildId) {
      delete drafts[draft.guildId]
    }

    await i.reply({ content: `Draft canceled`, ephemeral: true })
  } else {
    await i.reply({ content: `There is no active draft to cancel`, ephemeral: true })
  }
}
