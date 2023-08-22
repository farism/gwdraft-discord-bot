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
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('description')
          .setDescription('Adds a description to the draft'),
      )
      .addBooleanOption((option) =>
        // prettier-ignore
        option
          .setName('open_pool')
          .setDescription('Create an orderless open pool draft'),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('count')
          .setDescription('How many players are required to join the draft before starting (default = 16)'),
      )
      .addBooleanOption((option) =>
        // prettier-ignore
        option
          .setName('skip_signup_ping')
          .setDescription('This should be true if you want to skip the signup role ping (default = false)'),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add_players')
      .setDescription('Manually add players to the draft')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user1')
          .setDescription('A player to add')
          .setRequired(true),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user2')
          .setDescription('A player to add'),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user3')
          .setDescription('A player to add'),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user4')
          .setDescription('A player to add'),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user5')
          .setDescription('A player to add'),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove_players')
      .setDescription('Manually remove players from the draft')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user1')
          .setDescription('A player to remove')
          .setRequired(true),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user2')
          .setDescription('A player to remove'),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user3')
          .setDescription('A player to remove'),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user4')
          .setDescription('A player to remove'),
      )
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user5')
          .setDescription('A player to remove'),
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
      )
      .addBooleanOption((option) =>
        // prettier-ignore
        option
          .setName('open_pool')
          .setDescription('Set draft type to be open pool'),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('winner')
      .setDescription('Record the winning team of the last game')
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('team')
          .setDescription('The winning team')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('ban')

      .setDescription('Ban a player')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to ban')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('unban')
      .setDescription('Unban a player')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The player to ban')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('banlist')
      .setDescription('List all banned players')
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('cancel').setDescription('Cancel the current draft'),
  )
