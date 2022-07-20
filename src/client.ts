import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client, Intents } from 'discord.js'
import { commands } from './commands'

export const rest = new REST({ version: '9' })

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

// must load .env config before calling login
export async function setupClient(onReady: (client: Client) => void) {
  if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error('Missing DISCORD_CLIENT_ID environment variable')
  }

  if (!process.env.DISCORD_TOKEN) {
    throw new Error('Missing DISCORD_TOKEN environment variable')
  }

  rest.setToken(process.env.DISCORD_TOKEN)

  try {
    console.log('Updating application slash commands...')

    rest
      .put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands })
      .then(() => {
        console.log('Successfully updated application slash commands')
      })

    console.log('Logging in...')

    // client.on('debug', console.log)

    client.on('ready', () => {
      console.log('Logged in')

      onReady(client)
    })

    await client.login(process.env.DISCORD_TOKEN)
  } catch (error) {
    console.error(error)
  }
}
