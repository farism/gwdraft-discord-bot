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
