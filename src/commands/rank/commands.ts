import { SlashCommandBuilder } from '@discordjs/builders'
import { Profession } from '../../types'

export const professionChoices = Object.entries(Profession).map(([name, value]) => ({
  name,
  value,
}))

export const rankChoices = [
  { name: '1', value: 1 },
  { name: '2', value: 2 },
  { name: '3', value: 3 },
  { name: '4', value: 4 },
  { name: '5', value: 5 },
]

export const rankCmd = new SlashCommandBuilder()
  .setName('rank')
  .setDescription(`Edit player ranks`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('profession')
      .setDescription('Rank a player by specified profession')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The user to rank')
          .setRequired(true),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('profession')
          .setDescription('The profession we are ranking')
          .setRequired(true)
          .addChoices(...professionChoices),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('rank')
          .setDescription('The assigned rank')
          .setRequired(true)
          .addChoices(...rankChoices),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('all')
      .setDescription('Rank a player in all categories')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The user to rank')
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('rank')
          .setDescription('The assigned rank')
          .setRequired(true)
          .addChoices(...rankChoices),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('utility')
      .setDescription('Set player utility ranks')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The user to rank')
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('split')
          .setDescription('How effective is the user at splitting')
          .setRequired(false)
          .addChoices(...rankChoices),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('micro')
          .setDescription('How effective is the user at micro')
          .setRequired(false)
          .addChoices(...rankChoices),
      )
      .addIntegerOption((option) =>
        // prettier-ignore
        option
          .setName('macro')
          .setDescription('How effective is the user at macro')
          .setRequired(false)
          .addChoices(...rankChoices),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('reset')
      .setDescription('Reset all player ranks')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The user to rank')
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('view')
      .setDescription('View player ranks')
      .addUserOption((option) =>
        // prettier-ignore
        option
          .setName('user')
          .setDescription('The user to rank')
          .setRequired(true),
      ),
  )
