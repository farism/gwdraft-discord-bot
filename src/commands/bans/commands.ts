import { SlashCommandBuilder } from '@discordjs/builders'

export const banCmd = new SlashCommandBuilder()
  .setName('c')
  .setDescription(`Manage bans`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('ban')
      .setDescription('Ban or unban a player')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to ban or unban'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('reason')
          .setDescription('The reason the player is banned'),
      ),
  )
  .addSubcommand((subcommand) => subcommand.setName('unba').setDescription('Ban a player'))
