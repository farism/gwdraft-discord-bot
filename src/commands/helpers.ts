import { CommandInteraction } from 'discord.js'
import { getGuildSettings } from '../firebase'
import { Draft } from './draft/draft'

export function getDraft(i: CommandInteraction, drafts: { [k: string]: Draft }) {
  if (i.guildId) {
    return drafts[i.guildId]
  }
}

export function interactionHasRole(i: CommandInteraction, roleIdOrName: string) {
  const member = i.guild?.members.cache.get(i.user.id)

  return member?.roles.cache.some((r) => {
    return r.id === roleIdOrName || r.name === roleIdOrName
  })
}

export async function interactionIsDraftModerator(i: CommandInteraction) {
  const guildSettings = await getGuildSettings(i)

  if (guildSettings?.draft_moderator_role) {
    return interactionHasRole(i, guildSettings.draft_moderator_role)
  }

  return true
}
