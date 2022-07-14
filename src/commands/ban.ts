import { SlashCommandBuilder } from '@discordjs/builders'
import { CacheType, CommandInteraction } from 'discord.js'

export const banCmd = new SlashCommandBuilder()
  .setName('bans')
  .setDescription(`Manage bans`)
  .addSubcommand((subcommand) => subcommand.setName('player').setDescription('Ban a player'))
  .addSubcommand((subcommand) =>
    subcommand
      .setName('skill')
      .setDescription('Ban a skill')
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('count')
          .setDescription('max number of skill on team')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) => subcommand.setName('flux').setDescription('Ban a flux'))
  .addSubcommand((subcommand) => subcommand.setName('schedule').setDescription('Schedule bans'))

export async function handleBanPlayer(i: CommandInteraction<CacheType>) {
  i.reply({ content: 'used /ban player', ephemeral: true })
}

export async function handleBanSkill(i: CommandInteraction<CacheType>) {
  i.reply({ content: 'used /ban skill', ephemeral: true })
}

export async function handleBanFlux(i: CommandInteraction<CacheType>) {
  i.reply({ content: 'used /ban flux', ephemeral: true })
}

export async function handleBanSchedule(i: CommandInteraction<CacheType>) {
  i.reply({ content: 'used /ban schedule', ephemeral: true })
}
