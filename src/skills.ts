import { createCanvas, loadImage, Canvas, Image } from 'canvas'
import path from 'path'
const skillsMapById = require('../assets/skillsMapById.json')

interface SkillData {
  a: number
  c: number
  cd: string
  d: string
  e: number
  n: string
  p: number
  t: number
  z: {
    c: number
    co: number
    d?: number
    e: number
    q: number
    r: number
    sp: number
  }
}

export enum Profession {
  None,
  Warrior,
  Ranger,
  Monk,
  Necromancer,
  Mesmer,
  Elementalist,
  Assassin,
  Ritualist,
  Paragon,
  Dervish,
}

export enum Attribute {
  FastCasting,
  IllusionMagic,
  DominationMagic,
  InspirationMagic,
  BloodMagic,
  DeathMagic,
  SoulReaping,
  Curses,
  AirMagic,
  EarthMagic,
  FireMagic,
  WaterMagic,
  EnergyStorage,
  HealingPrayers,
  SmitingPrayers,
  ProtectionPrayers,
  DivineFavor,
  Strength,
  AxeMastery,
  HammerMastery,
  Swordsmanship,
  Tactics,
  BeastMastery,
  Expertise,
  WildernessSurvival,
  Marksmanship,
  DaggerMastery = 29,
  DeadlyArts,
  ShadowArts,
  Communing,
  RestorationMagic,
  ChannelingMagic,
  CriticalStrikes,
  SpawningPower,
  SpearMastery,
  Command,
  Motivation,
  Leadership,
  ScytheMastery,
  WindPrayers,
  EarthPrayers,
  Mysticism,
  NornRank = 214,
  EbonVanguardRank,
  DeldrimorRank,
  AsuraRank,
  LightbringerRank = 235,
  SunspearRank = 238,
  LuxonRank = 249,
  KurzickRank,
}

export interface Skillbar {
  type: typeof TEMPLATE_TYPE
  version: typeof VERSION
  primary: Profession
  secondary: Profession
  attributes: Partial<Record<Attribute, number>>
  skills: number[]
  template: string
}

export const ProfessionAbbreviation: Record<Profession, string> = {
  [Profession.None]: 'x',
  [Profession.Warrior]: 'W',
  [Profession.Ranger]: 'R',
  [Profession.Monk]: 'Mo',
  [Profession.Necromancer]: 'N',
  [Profession.Mesmer]: 'Me',
  [Profession.Elementalist]: 'E',
  [Profession.Assassin]: 'A',
  [Profession.Ritualist]: 'Rt',
  [Profession.Paragon]: 'P',
  [Profession.Dervish]: 'D',
}

export const ProfessionNames: Record<Profession, string> = {
  [Profession.None]: 'None',
  [Profession.Warrior]: 'Warrior',
  [Profession.Ranger]: 'Ranger',
  [Profession.Monk]: 'Monk',
  [Profession.Necromancer]: 'Necromancer',
  [Profession.Mesmer]: 'Mesmer',
  [Profession.Elementalist]: 'Elementalist',
  [Profession.Assassin]: 'Assassin',
  [Profession.Ritualist]: 'Ritualist',
  [Profession.Paragon]: 'Paragon',
  [Profession.Dervish]: 'Dervish',
}

export const AttributeNames: Record<Attribute, string> = {
  [Attribute.FastCasting]: 'Fast Casting',
  [Attribute.IllusionMagic]: 'Illusion Magic',
  [Attribute.DominationMagic]: 'Domination Magic',
  [Attribute.InspirationMagic]: 'Inspiration Magic',
  [Attribute.BloodMagic]: 'Blood Magic',
  [Attribute.DeathMagic]: 'Death Magic',
  [Attribute.SoulReaping]: 'Soul Reaping',
  [Attribute.Curses]: 'Curses',
  [Attribute.AirMagic]: 'Air Magic',
  [Attribute.EarthMagic]: 'Earth Magic',
  [Attribute.FireMagic]: 'Fire Magic',
  [Attribute.WaterMagic]: 'Water Magic',
  [Attribute.EnergyStorage]: 'Energy Storage',
  [Attribute.HealingPrayers]: 'Healing Prayers',
  [Attribute.SmitingPrayers]: 'Smiting Prayers',
  [Attribute.ProtectionPrayers]: 'Protection Prayers',
  [Attribute.DivineFavor]: 'Divine Favor',
  [Attribute.Strength]: 'Strength',
  [Attribute.AxeMastery]: 'Axe Mastery',
  [Attribute.HammerMastery]: 'Hammer Mastery',
  [Attribute.Swordsmanship]: 'Swordsmanship',
  [Attribute.Tactics]: 'Tactics',
  [Attribute.BeastMastery]: 'Beast Mastery',
  [Attribute.Expertise]: 'Expertise',
  [Attribute.WildernessSurvival]: 'Wilderness Survival',
  [Attribute.Marksmanship]: 'Marksmanship',
  [Attribute.DaggerMastery]: 'Dagger Mastery',
  [Attribute.DeadlyArts]: 'Deadly Arts',
  [Attribute.ShadowArts]: 'Shadow Arts',
  [Attribute.Communing]: 'Communing',
  [Attribute.RestorationMagic]: 'Restoration Magic',
  [Attribute.ChannelingMagic]: 'Channeling Magic',
  [Attribute.CriticalStrikes]: 'Critical Strikes',
  [Attribute.SpawningPower]: 'Spawning Power',
  [Attribute.SpearMastery]: 'Spear Mastery',
  [Attribute.Command]: 'Command',
  [Attribute.Motivation]: 'Motivation',
  [Attribute.Leadership]: 'Leadership',
  [Attribute.ScytheMastery]: 'Scythe Mastery',
  [Attribute.WindPrayers]: 'Wind Prayers',
  [Attribute.EarthPrayers]: 'Earth Prayers',
  [Attribute.Mysticism]: 'Mysticism',
  [Attribute.NornRank]: 'Norn Rank',
  [Attribute.EbonVanguardRank]: 'Ebon Vanguard Rank',
  [Attribute.DeldrimorRank]: 'Deldrimor Rank',
  [Attribute.AsuraRank]: 'Asura Rank',
  [Attribute.LightbringerRank]: 'Lightbringer Rank',
  [Attribute.SunspearRank]: 'Sunspear Rank',
  [Attribute.LuxonRank]: 'Luxon Rank',
  [Attribute.KurzickRank]: 'Kurzick Rank',
}

const ASSETS_DIR = path.join(__dirname, '../assets')
const IMAGE_SIZE = 64
const TEMPLATE_TYPE = 14
const VERSION = 0
const BASE_64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function getProfessionName<T extends keyof typeof ProfessionNames>(
  profession: T,
): typeof ProfessionNames[T] {
  return ProfessionNames[profession]
}

export function getAttributeName<T extends keyof typeof AttributeNames>(
  attribute: T,
): typeof AttributeNames[T] {
  return AttributeNames[attribute]
}

function binpadright(s: string, n: number) {
  return s.padEnd(n, '0')
}

function valbin(v: string | number, n: number) {
  return binpadright(strrev(parseInt(v.toString()).toString(2)), n)
}

function binval(b: string) {
  return parseInt(strrev(b), 2)
}

function strrev(s: string) {
  return (s || '').split('').reverse().join('')
}

function charindex(c: string) {
  const n = BASE_64.length
  for (let i = 0; i < n; i++) if (BASE_64.substr(i, 1) == c) return i
  throw Error
}

function codetobin(template: string) {
  const length = template.length
  let binary = ''
  for (let i = 0; i < length; i++) {
    binary += valbin(charindex(template.substr(i, 1)).toString(), 6)
  }
  return binary
}

function bintocode(bin: string) {
  const r = bin.length % 6
  let c = ''
  if (r != 0) bin = binpadright(bin, bin.length + 6 - r)
  while (bin.length > 0) {
    c += BASE_64.substr(parseInt(strrev(bin.substr(0, 6)), 2), 1)
    bin = bin.substr(6)
  }
  return c
}

export function decodeTemplate(template: string): Skillbar | null {
  const binary = codetobin(template)
  let offset = 0
  const read = (bits: number) => {
    const out = binary.substr(offset, bits)
    offset += bits
    return binval(out)
  }
  const templateType = read(4)
  if (templateType != TEMPLATE_TYPE) {
    return null
  }
  const version = read(4) as typeof VERSION
  const professionBitLength = read(2) * 2 + 4
  const primary = read(professionBitLength)
  const secondary = read(professionBitLength)
  const attributeCount = read(4)
  const attributeBitLength = read(4) + 4
  const attributes: Partial<Record<Attribute, number>> = {}

  for (let i = 0; i < attributeCount; i++) {
    attributes[read(attributeBitLength) as Attribute] = read(4)
  }

  const skillBitLength = read(4) + 8
  const skills = new Array(8)

  for (let i = 0; i < 8; i++) {
    skills[i] = skillsMapById[read(skillBitLength)]
  }

  return {
    type: templateType,
    version,
    primary,
    secondary,
    attributes,
    skills,
    template,
  }
}

export function encodeSkillbar(skillbar: Exclude<Skillbar, 'template'>): string {
  const type = valbin(skillbar.type, 4)
  const version = valbin(skillbar.version, 4)
  const professionBitLength = Math.max(
    4,
    valbin(skillbar.primary, 0).length,
    valbin(skillbar.secondary, 0).length,
  )
  const primary = valbin(skillbar.primary, professionBitLength)
  const secondary = valbin(skillbar.secondary, professionBitLength)
  const attributeCount = valbin(Object.keys(skillbar.attributes).length, 4)
  const attributeBitLength = Math.max(
    4,
    ...Object.keys(skillbar.attributes).map((a) => valbin(a, 0).length),
  )
  const attributes = Object.entries(skillbar.attributes).reduce(
    (out, [attributeId, attributeLevel]) => {
      return [...out, valbin(attributeId, attributeBitLength), valbin(attributeLevel!, 4)]
    },
    [] as string[],
  )
  const skillBitLength = Math.max(8, ...skillbar.skills.map((skillId) => valbin(skillId, 0).length))
  const skills = skillbar.skills.map((skillId) => valbin(skillId, skillBitLength))
  const template = [
    type,
    version,
    valbin(Math.max(Math.ceil((professionBitLength - 4) / 2), 0), 2),
    primary,
    secondary,
    attributeCount,
    valbin(Math.max(attributeBitLength - 4, 0), 4),
    ...attributes,
    valbin(Math.max(skillBitLength - 8, 0), 4),
    ...skills,
  ]

  return bintocode(template.join(''))
}

export async function skillbarToImage(skillbar: Skillbar): Promise<Canvas> {
  const canvas = createCanvas(8 * IMAGE_SIZE, IMAGE_SIZE)
  const ctx = canvas.getContext('2d')
  const hex = await loadImage(path.join(ASSETS_DIR, 'images', 'skill-hex.png'))
  const enchantment = await loadImage(path.join(ASSETS_DIR, 'images', 'skill-enchantment.png'))
  const types: string[] = []
  const promises: Promise<Image>[] = []

  skillbar.skills.forEach((skill: any, i) => {
    types.push(skill?.type)

    promises.push(loadImage(path.join(ASSETS_DIR, 'images', 'skills', `${skill?.id || 0}.jpg`)))
  })

  try {
    const images = await Promise.all(promises)

    images.forEach((img, i) => {
      ctx.drawImage(img, i * IMAGE_SIZE, 0, IMAGE_SIZE, IMAGE_SIZE)

      if (types[i]?.includes('Hex')) {
        ctx.drawImage(hex, i * IMAGE_SIZE + IMAGE_SIZE - 22, 2, 20, 19)
      } else if (types[i]?.includes('Enchantment')) {
        ctx.drawImage(enchantment, i * IMAGE_SIZE + IMAGE_SIZE - 22, 2, 20, 19)
      }

      ctx.fillStyle = 'rgba(50, 50, 50, 0.9)'
      ctx.fillRect(i * IMAGE_SIZE + IMAGE_SIZE - 18, IMAGE_SIZE - 18, 18, 18)

      ctx.font = '14px Arial'
      ctx.fillStyle = 'white'
      ctx.shadowColor
      ctx.fillText(String(i + 1), i * IMAGE_SIZE + IMAGE_SIZE - 12, IMAGE_SIZE - 4)
    })
  } catch (e) {
    console.error(e)
  }

  return canvas
}
