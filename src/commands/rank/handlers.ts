import { CommandInteraction } from 'discord.js'
import { defaultRanks, players } from '../../firebase'
import { Profession, Rankings } from '../../types'

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

function createRankingPayload(i: CommandInteraction, payload: any) {
  if (!i.guildId) {
    return {}
  }

  return {
    userName: i.options.getUser('user', true).username,
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

export async function handleRankProfession(i: CommandInteraction) {
  if (!i.guildId) {
    return
  }

  const user = i.options.getUser('user', true)

  const profession = i.options.getString('profession', true)

  const rank = i.options.getInteger('rank', true)

  const payload = createRankingPayload(i, { [profession]: rank })

  await players.doc(user.id).set(payload, { merge: true })

  i.reply({ content: 'used /rank profession', ephemeral: true })
}

export async function handleRankAll(i: CommandInteraction) {
  if (!i.guildId) {
    return
  }

  const user = i.options.getUser('user', true)

  const rank = i.options.getInteger('rank', true)

  const payload = createRankingPayload(i, defaultRanks(rank))

  await players.doc(user.id).set(payload, { merge: true })

  i.reply({ content: 'used /rank all', ephemeral: true })
}

export async function handleRankUtility(i: CommandInteraction) {
  i.reply({ content: 'used /rank utility', ephemeral: true })
}

export async function handleRankReset(i: CommandInteraction) {
  i.reply({ content: 'used /rank reset', ephemeral: true })
}

async function getRankings(i: CommandInteraction): Promise<Rankings> {
  const user = i.options.getUser('user', true)

  const doc = await players.doc(user.id).get()

  if (i.guildId) {
    return doc.data()?.ranking[i.guildId][i.user.id]
  }

  return {}
}

export async function handleRankView(i: CommandInteraction) {
  const rankings = await getRankings(i)

  i.reply({ content: formatRankings(rankings), ephemeral: true })
}
