import { CommandInteraction } from 'discord.js'

export async function handleBanPlayer(i: CommandInteraction) {
  i.reply({ content: 'used /ban player', ephemeral: true })
}

export async function handleBanSkill(i: CommandInteraction) {
  i.reply({ content: 'used /ban skill', ephemeral: true })
}

export async function handleBanFlux(i: CommandInteraction) {
  i.reply({ content: 'used /ban flux', ephemeral: true })
}

export async function handleBanSchedule(i: CommandInteraction) {
  i.reply({ content: 'used /ban schedule', ephemeral: true })
}
