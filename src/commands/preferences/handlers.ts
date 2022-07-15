import { CommandInteraction } from 'discord.js'
import { players } from '../../firebase'
import { Profession } from '../../types'

export async function handlePreferencesSet(i: CommandInteraction) {
  const preferences: Profession[] = []

  for (let j = 0; j < 10; j++) {
    const pref = i.options.get(String(j + 1))?.value ?? null

    preferences[j] = pref as Profession
  }

  const doc = players.doc(i.user.id)

  i.reply({ content: 'used /preferences set', ephemeral: true })
}

export async function handlePreferencesClear(i: CommandInteraction) {
  i.reply({ content: 'used /preferences clear', ephemeral: true })
}

export async function handlePreferencesView(i: CommandInteraction) {
  i.reply({ content: 'used /preferences view', ephemeral: true })
}
