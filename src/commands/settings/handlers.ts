import { CommandInteraction } from 'discord.js'
import { getGuildSettings, settings } from '../../firebase'
import { userHasRole } from '../permissions'

export async function handleSettings(i: CommandInteraction) {
  if (!i.guildId) {
    return
  }

  const s = await getGuildSettings(i.guildId)

  const hasAdminRole = userHasRole(i.guild, i.user.id, s?.admin_role || '0')

  if (i.guild?.ownerId !== i.user.id && !hasAdminRole) {
    i.reply({ content: `You must be the server owner or have an admin role`, ephemeral: true })
    return
  }

  const doc = await settings.doc(i.guildId)

  const newSettings: { [k: string]: any } = {}

  i.options.data.forEach((opt) => {
    if (opt.value) {
      newSettings[opt.name] = opt.value
    }
  })

  doc.set(newSettings, { merge: true })

  i.reply({ content: 'Settings have been updated', ephemeral: true })
}
