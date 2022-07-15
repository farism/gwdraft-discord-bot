import { CommandInteraction } from 'discord.js'
import { GuildId } from '../../types'
import { Draft } from './draft'

const drafts: { [k: GuildId]: Draft } = {}

export function getDraft(i: CommandInteraction, drafts: { [k: string]: Draft }) {
  if (i.guildId) {
    return drafts[i.guildId]
  }
}

export async function handleDraftStart(i: CommandInteraction) {
  if (!i.guildId) {
    i.reply({ content: 'Invalid guild id' })
    return
  }

  // if (drafts[i.guildId]) {
  //   i.reply({ content: 'Active draft exists' })
  //   return
  // }

  await i.reply({ content: `<@${i.user.id}> has started a draft` })

  drafts[i.guildId] = new Draft(i)
}

export async function handleDraftCommence(i: CommandInteraction) {
  if (!i.guildId) {
    i.reply({ content: 'Invalid guild id' })
    return
  }

  if (!drafts[i.guildId]) {
    i.reply({ content: 'There is no active draft' })
    return
  }

  await i.reply({ content: `<@${i.user.id}> has started a draft` })

  drafts[i.guildId] = new Draft(i)
}

export async function handleDraftAddPlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  getDraft(i, drafts)?.addUser(user)

  await i.reply({ content: `used /draft addplayer` })
}

export async function handleDraftRemovePlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  getDraft(i, drafts)?.removeUser(user)

  await i.reply({ content: i.toString() })
}

export async function handleDraftMovePlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  const position = Math.max(0, i.options.getInteger('position', true) - 1)

  getDraft(i, drafts)?.moveUser(user, position)

  await i.reply({ content: `used /draft moveplayer` })
}

export async function handleDraftEdit(i: CommandInteraction) {
  const draft = getDraft(i, drafts)

  if (draft) {
    const location = i.options.getString('location')

    if (location) {
      draft.location = location
    }

    const description = i.options.getString('description')

    if (description) {
      draft.description = description
    }
  }

  await i.reply({ content: `used /draft edit` })
}

export async function handleDraftCancel(i: CommandInteraction) {
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
