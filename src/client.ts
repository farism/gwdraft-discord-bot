import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client, Intents } from 'discord.js'
import { commands } from './commands'

export const CLIENT_ID = '989459684715008040'

export const TOKEN = 'OTg5NDU5Njg0NzE1MDA4MDQw.G7SQa2.caRsGKb5Vpz4w_VH0_0bY4sCEPbzljd6rsBNj8'

export const rest = new REST({ version: '9' }).setToken(TOKEN)
export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`)
})

export async function updateCommands() {
  console.log('Started refreshing application (/) commands.')

  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })

  console.log('Successfully reloaded application (/) commands.')
}

export async function login() {
  try {
    await client.login(TOKEN)
  } catch (error) {
    console.error(error)
  }
}
