import { SlashCommandBuilder } from '@discordjs/builders'

export const templatesCmd = new SlashCommandBuilder()
  .setName('template')
  .setDescription(`Manage templates`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('skill')
      .setDescription('Show a skill template')
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('code')
          .setDescription('A skill template')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('team')
      .setDescription('Show a team template')
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('1')
          .setDescription('Position 1 skill template'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('2')
          .setDescription('Position 2 skill template'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('3')
          .setDescription('Position 3 skill template'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('4')
          .setDescription('Position 4 skill template'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('5')
          .setDescription('Position 5 skill template'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('6')
          .setDescription('Position 6 skill template'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('7')
          .setDescription('Position 7 skill template'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('8')
          .setDescription('Position 8 skill template'),
      ),
  )
