import { SlashCommandBuilder } from '@discordjs/builders'

export const draftCmd = new SlashCommandBuilder()
  .setName('draft')
  .setDescription(`Manage drafts`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('create')
      .setDescription('Create a draft')
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('time')
          .setDescription('Starts the draft at the specified time in HH:mm format GMT+2 (e.g. "20:00")'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('location')
          .setDescription('The location where players should players meet in game (default = GToB AE1)'),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('count')
          .setDescription('How many players are required to join the draft before starting (default = 16)'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('description')
          .setDescription('Adds a description to the draft'),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('ready_wait_time')
          .setDescription('How much time a player has to check ready before moving to end of queue, in minutes (default = 5)'),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('start').setDescription('Begin the draft once all players are ready'),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add_player')
      .setDescription('Manually add a player to the draft')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to add')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove_player')
      .setDescription('Manually remove a player from the draft')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to remove')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('reorder_player')
      .setDescription('Move player order in the count')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to move')
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('position')
          .setDescription('The position to put the player in')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('edit')
      .setDescription('Edit the active draft')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('host')
          .setDescription('The new draft host'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('location')
          .setDescription('The location where players should players meet in game (default = GToB AE1)'),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('description')
          .setDescription('Adds a description to the draft'),
      ),
  )
  // .addSubcommand((subcommand) =>
  //   subcommand
  //     .setName('winner')
  //     .setDescription('Record the winning team of the last game')
  //     .addIntegerOption((option) =>
  //       // prettier-ignore
  //       option
  //         .setName('team')
  //         .setDescription('The winning team')
  //         .setRequired(true),
  //     ),
  // )
  .addSubcommand((subcommand) =>
    subcommand.setName('cancel').setDescription('Cancel the current draft'),
  )
