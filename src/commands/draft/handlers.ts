import { CommandInteraction } from 'discord.js'
import { addLossToPlayer, addWinToPlayer, getGuildSettings } from '../../firebase'
import { GuildId } from '../../types'
import { userHasRole } from '../helpers'
import { Draft } from './draft'

const drafts: { [k: GuildId]: Draft } = {}

export function getDraft(i: CommandInteraction) {
  if (i.guildId) {
    return drafts[i.guildId]
  }
}

export async function handleDraftCreate(i: CommandInteraction) {
  if (!i.guildId) {
    i.reply({ content: 'Invalid guild id' })
    return
  }

  // if (drafts[i.guildId]) {
  //   i.reply({ content: 'Active already draft exists. You may need to cancel it first.' })
  //   return
  // }

  const guildSettings = await getGuildSettings(i)

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
    await i.reply({ content: `A draft has been scheduled` })

    drafts[i.guildId] = new Draft(i)
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
      draft.host = host
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
    } catch (e) {}

    if (draft.interaction.guildId) {
      delete drafts[draft.interaction.guildId]
    }

    await i.reply({ content: `Draft canceled`, ephemeral: true })
  } else {
    await i.reply({ content: `There is no active draft to cancel`, ephemeral: true })
  }
}
