import { CommandInteraction } from 'discord.js'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { Player, Rankings } from './types'

initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()

export const settings = db.collection('settings')

export const players = db.collection('players')

export function defaultPlayer(): Player {
  return {
    wins: 0,
    losses: 0,
    preferences: [],
    rankings: {},
  }
}

export function defaultRanks(rank: number = 0): Rankings {
  return {
    Assassin: rank,
    Dervish: rank,
    Elementalist: rank,
    Mesmer: rank,
    Monk: rank,
    Necromancer: rank,
    Paragon: rank,
    Ranger: rank,
    Ritualist: rank,
    Warrior: rank,
  }
}

export interface Settings {
  draft_channel?: string
  draft_audit_log_channel?: string
  draft_moderator_role?: string
  draft_player_role?: string
}

export async function getGuildSettings(interaction: CommandInteraction): Promise<Settings | null> {
  const doc = await settings.doc(interaction.guildId || '').get()

  return doc.data() as Settings | null
}

export async function addWinToPlayer(id: string) {
  const doc = players.doc(id)

  doc.set({ wins: FieldValue.increment(1) }, { merge: true })
}

export async function addLossToPlayer(id: string) {
  const doc = players.doc(id)

  doc.set({ losses: FieldValue.increment(1) }, { merge: true })
}

// players.onSnapshot((snapshot) => {
//   for (const doc of snapshot.docs) {
//     console.log(doc.data())
//   }
// })

// settings.onSnapshot((snapshot) => {
//   snapshot.docs.forEach((d) => {
//     console.log(d.data())
//   })
// })
