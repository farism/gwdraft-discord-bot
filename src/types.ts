export type GuildId = string

export enum Profession {
  Assassin = 'Assassin',
  Dervish = 'Dervish',
  Elementalist = 'Elementalist',
  Mesmer = 'Mesmer',
  Monk = 'Monk',
  Necromancer = 'Necromancer',
  Paragon = 'Paragon',
  Ranger = 'Ranger',
  Ritualist = 'Ritualist',
  Warrior = 'Warrior',
}

export type ProfessionEmojiIds = {
  [P in Professions]: string
}

export type Rankings = {
  [P in Professions]?: number
}

export type Professions = keyof typeof Profession

export interface Player {
  wins: number
  losses: number
  preferences: Profession[]
  rankings: {
    [k: GuildId]: Rankings
  }
}

export interface Signups {}
