import { SlashCommandBuilder } from '@discordjs/builders'
import { professionChoices } from '../rank/commands'

export const preferencesCmd = new SlashCommandBuilder()
  .setName('preferences')
  .setDescription(`Edit player ranks`)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('set')
      .setDescription('Set your preferences, 1 being most preferred')
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('1')
          .setDescription('1st preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('2')
          .setDescription('2nd preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('3')
          .setDescription('3rd preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('4')
          .setDescription('4th preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('5')
          .setDescription('5th preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('6')
          .setDescription('6th preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('7')
          .setDescription('7th preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('8')
          .setDescription('8th preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('9')
          .setDescription('9th preference')
          .addChoices(...professionChoices),
      )
      .addStringOption((option) =>
        // prettier-ignore
        option
          .setName('10')
          .setDescription('10th preference')
          .addChoices(...professionChoices),
      ),
  )
