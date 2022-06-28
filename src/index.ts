import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client, Intents, User } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

const CLIENT_ID = '989459684715008040'
const GUILD_ID = '893891200015298660'
const TOKEN = 'OTg5NDU5Njg0NzE1MDA4MDQw.G7SQa2.caRsGKb5Vpz4w_VH0_0bY4sCEPbzljd6rsBNj8'

const draftCmd = new SlashCommandBuilder().setName('draft').setDescription('Starts a draft')

const rankCmd = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Rank a player')
  .addUserOption((option) =>
    option.setName('username').setDescription('The user to rank').setRequired(false),
  )
  .addIntegerOption((option) =>
    option
      .setName('rank')
      .setDescription('The assigned rank')
      .addChoices({ name: '1', value: 1 })
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName('profession')
      .setDescription('The profession we are ranking')
      .addChoices(
        { name: 'Assassin', value: 'Assassin' },
        { name: 'Dervish', value: 'Dervish' },
        { name: 'Elementalist', value: 'Elementalist' },
        { name: 'Mesmer', value: 'Mesmer' },
        { name: 'Monk', value: 'Monk' },
        { name: 'Necromancer', value: 'Necromancer' },
        { name: 'Paragon', value: 'Paragon' },
        { name: 'Ranger', value: 'Ranger' },
        { name: 'Ritualist', value: 'Ritualist' },
        { name: 'Warrior', value: 'Warrior' },
      )
      .setRequired(false),
  )

const commands = [draftCmd.toJSON(), rankCmd.toJSON()]

const rest = new REST({ version: '9' }).setToken(TOKEN)

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

;(async () => {
  try {
    console.log('Started refreshing application (/) commands.')

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })

    // console.log('Successfully reloaded application (/) commands.')

    client.on('ready', () => {
      console.log(`Logged in as ${client.user?.tag}!`)
    })

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return

      if (interaction.commandName === 'draft') {
        // console.log(interaction.guildId)
        await interaction.reply({ content: 'starting draft', ephemeral: true })
      } else if (interaction.commandName === 'rank') {
        console.log(interaction.options.get('username')?.value)
        console.log(interaction.options.get('rank')?.value)
        console.log(interaction.options.get('profession')?.value)
        // console.log(interaction.options.get('username'))
        await interaction.reply({ content: 'ranking player!', ephemeral: true })
        // await interaction.reply({ content: 'ranking player 2!', ephemeral: true })
      }
    })

    await client.login(TOKEN)

    const guild = client.guilds.cache.get(GUILD_ID)

    guild?.commands.set([])
  } catch (error) {
    console.error(error)
  }
})()

initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()

const players = db.collection('players')

players.get().then((resp) => {
  for (let doc of resp.docs) {
    console.log(doc.data())
  }
})
