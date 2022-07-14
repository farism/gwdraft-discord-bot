import { SlashCommandBuilder } from '@discordjs/builders'
import { CacheType, CommandInteraction } from 'discord.js'
import { defaultRanks, players } from '../firebase'
import { Profession, Rankings } from '../types'
import { getProfession, getRank, getUser } from './helpers'

function formatRankings(rankings: Rankings): string {
  //   return `
  // \`\`\`
  // ${Object.values(Profession)
  //   .map((p) => `${p}: ${rankings[p]}`)
  //   .join('\n')}
  // \`\`\`
  //   `
  return ''
}

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

function createRankingPayload(i: CommandInteraction<CacheType>, payload: any) {
  if (!i.guildId) {
    return {}
  }

  return {
    userName: getUser(i).username,
    ranking: {
      [i.guildId]: {
        guildName: i.guild?.name,
        [i.user.id]: {
          judgeName: i.user.username,
          ...payload,
        },
      },
    },
  }
}

export async function handleRankProfession(i: CommandInteraction<CacheType>) {
  if (!i.guildId) {
    return
  }

  const payload = createRankingPayload(i, { [getProfession(i)]: getRank(i) })

  await players.doc(getUser(i).id).set(payload, { merge: true })

  i.reply({ content: 'used /rank profession', ephemeral: true })
}

export async function handleRankAll(i: CommandInteraction<CacheType>) {
  if (!i.guildId) {
    return
  }

  const payload = createRankingPayload(i, defaultRanks(getRank(i)))

  await players.doc(getUser(i).id).set(payload, { merge: true })

  i.reply({ content: 'used /rank all', ephemeral: true })
}

export async function handleRankUtility(i: CommandInteraction<CacheType>) {
  i.reply({ content: 'used /rank utility', ephemeral: true })
}

export async function handleRankReset(i: CommandInteraction<CacheType>) {
  i.reply({ content: 'used /rank reset', ephemeral: true })
}

async function getRankings(i: CommandInteraction<CacheType>): Promise<Rankings> {
  const doc = await players.doc(getUser(i).id).get()

  if (i.guildId) {
    return doc.data()?.ranking[i.guildId][i.user.id]
  }

  return {}
}

export async function handleRankView(i: CommandInteraction<CacheType>) {
  const rankings = await getRankings(i)

  i.reply({ content: formatRankings(rankings), ephemeral: true })
}
