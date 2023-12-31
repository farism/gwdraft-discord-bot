import { CommandInteraction, Guild, User } from 'discord.js'
import { getGuildSettings } from '../firebase'

export function userHasRole(guild: Guild | null, userId: string, roleIdOrName: string) {
  const member = guild?.members.cache.get(userId)

  return member?.roles.cache.some((r) => {
    return r.id === roleIdOrName || r.name === roleIdOrName
  })
}

export async function checkDraftModerator(i: CommandInteraction) {
  const guildSettings = await getGuildSettings(i.guildId)

  if (guildSettings?.draft_moderator_role) {
    if (!userHasRole(i.guild, i.user.id, guildSettings.draft_moderator_role)) {
      i.reply({
        content: `You must have the <@&${guildSettings.draft_moderator_role}> role`,
        ephemeral: true,
      })

      return false
    }
  }

  return true
}
