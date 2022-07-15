import { SlashCommandBuilder } from '@discordjs/builders'

export const teamCmd = new SlashCommandBuilder()
  .setName('team')
  .setDescription(`Manage teams`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('captain')
      .setDescription('Select a captain for a team')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to captain')
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('team')
          .setDescription('The team to captain')
          .setChoices({ name: '1', value: 1 }, { name: '2', value: 2 })
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('pick')
      .setDescription('Add a player to your team')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to pick')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('kick')
      .setDescription('Remove a player from your team')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to kick')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('swap')
      .setDescription('Swap a player to the other team')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to swap')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('reset').setDescription('Resets/clears out the teams'),
  )
