import { CacheType, CommandInteraction } from 'discord.js'
import { Draft } from './draft/draft'

export function getDraft(i: CommandInteraction<CacheType>, drafts: { [k: string]: Draft }) {
  if (i.guildId) {
    return drafts[i.guildId]
  }
}
