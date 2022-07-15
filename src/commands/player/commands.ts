import { SlashCommandBuilder } from '@discordjs/builders'

export const playerCmd = new SlashCommandBuilder()
  .setName('player')
  .setDescription(`Player management`)
  .addSubcommand((subcommand) => subcommand.setName('stats').setDescription('View your stats'))
  .addSubcommand((subcommand) =>
    subcommand
      .setName('ign')
      .setDescription('Set in game name, helps with guesting')
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('name')
          .setDescription('Your in-game name'),
      ),
  )
