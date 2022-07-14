import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { Player, Rankings } from './types'

initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()

export const players = db.collection('players')

export function defaultPlayer(rank: number = 0): Player {
  return {
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

// players.onSnapshot((snapshot) => {
//   for (const doc of snapshot.docs) {
//     console.log(doc.data())
//   }
// })
