import { CommandInteraction } from 'discord.js'

export async function handleConfigSet(i: CommandInteraction) {
  i.reply({ content: 'used /config set', ephemeral: true })
}

export async function handleConfigClear(i: CommandInteraction) {
  i.reply({ content: 'used /config clear', ephemeral: true })
}
