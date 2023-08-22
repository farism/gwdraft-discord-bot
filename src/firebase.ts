import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { Player, Rankings } from './types'

initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()

export const bans = db.collection('bans')

export const drafts = db.collection('drafts')

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
  admin_role?: string
  draft_channel?: string
  draft_audit_log_channel?: string
  draft_moderator_role?: string
  draft_player_role?: string
}

export async function getGuildSettings(guildId: string | null): Promise<Settings | null> {
  if (guildId) {
    const doc = await settings.doc(guildId).get()

    return doc.data() as Settings | null
  }

  return null
}

export async function addWinToPlayer(id: string) {
  const doc = players.doc(id)

  try {
    doc.set({ wins: FieldValue.increment(1) }, { merge: true })
  } catch (e) {
    console.log(`Failed adding win to player ${id}`)
    console.log(e)
  }
}

export async function addLossToPlayer(id: string) {
  const doc = players.doc(id)

  try {
    doc.set({ losses: FieldValue.increment(1) }, { merge: true })
  } catch (e) {
    console.log(`Failed adding loss to player ${id}`)
    console.log(e)
  }
}