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
