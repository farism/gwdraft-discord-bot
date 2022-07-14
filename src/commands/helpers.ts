import { CacheType, CommandInteraction } from 'discord.js'
import { Draft } from './draft'

export function getDraft(i: CommandInteraction<CacheType>, drafts: { [k: string]: Draft }) {
  if (i.guildId) {
    return drafts[i.guildId]
  }
}

export function getUser(i: CommandInteraction<CacheType>) {
  return i.options.getUser('user', true)
}

export function getRank(i: CommandInteraction<CacheType>) {
  return i.options.getInteger('rank', true)
}

export function getProfession(i: CommandInteraction<CacheType>) {
  return i.options.getString('profession', true)
}

export function getDraftId(i: CommandInteraction<CacheType>) {
  return i.options.getInteger('draft_id', true)
}
