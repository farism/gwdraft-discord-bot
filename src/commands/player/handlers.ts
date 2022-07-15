import { CommandInteraction } from 'discord.js'
import { players } from '../../firebase'

export async function handlePlayerStats(i: CommandInteraction) {
  if (!i.guildId) {
    return
  }

  const doc = await players.doc(i.user.id).get()

  const data = doc.data()

  const wins = data?.wins ?? 0

  const losses = data?.losses ?? 1

  const winRate = (wins / (wins + losses)) * 100

  const content = `Wins: ${wins} | Losses: ${losses} | Win Rate: ${winRate.toFixed(2)}%`

  i.reply({ content, ephemeral: true })
}

export async function handlePlayerIgn(i: CommandInteraction) {
  const doc = await players.doc(i.user.id)

  await doc.set({ ign: i.options.getString('name') }, { merge: true })

  i.reply({ content: `You have set your in-game name`, ephemeral: true })
}
