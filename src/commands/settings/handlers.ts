import { CommandInteraction } from 'discord.js'
import { settings } from '../../firebase'
import { interactionHasRole } from '../helpers'

export async function handleSettings(i: CommandInteraction) {
  if (!i.guildId) {
    return
  }

  if (interactionHasRole(i, 'admin')) {
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
