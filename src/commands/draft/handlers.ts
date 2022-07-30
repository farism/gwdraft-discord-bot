import { CommandInteraction, User } from 'discord.js'
import { getGuildSettings } from '../../firebase'
import { userHasRole } from '../permissions'
import { Draft } from './draft'
import { addDraft, getDraft, removeDraft } from './registry'

const winnerWaitTime = 3 * 60 * 1000

const winnerTimestamps: { [k: string]: Date } = {}

export async function handleDraftCreate(i: CommandInteraction) {
  if (getDraft(i)) {
    i.reply({
      content: 'Active draft already exists. You need to cancel it first.',
      ephemeral: true,
    })

    return
  }

  const guildSettings = await getGuildSettings(i.guildId)

  const hasRole = guildSettings?.draft_moderator_role
    ? userHasRole(i.guild, i.user.id, guildSettings?.draft_moderator_role || '')
    : true

  const isInDraftChannel = guildSettings?.draft_channel
    ? guildSettings.draft_channel === i.channel?.id
    : true

  if (!hasRole) {
    await i.reply({
      content: `You do not have the <@&${guildSettings?.draft_moderator_role}> role`,
      ephemeral: true,
    })
  } else if (!isInDraftChannel) {
    await i.reply({
      content: `Invalid channel, please use <#${guildSettings?.draft_channel}>`,
      ephemeral: true,
    })
  } else {
    const time = i.options.getString('time')
    const location = i.options.getString('location') || 'Great Temple of Balthazar - AE1'
    const count = i.options.getInteger('count') || 16
    const description = i.options.getString('description') || ''
    const skipSignupPing = i.options.getBoolean('skip_signup_ping') || false
    const openPool = i.options.getBoolean('open_pool') || false

    if (i.guildId) {
      try {
        await i.deferReply({ ephemeral: true })

        const draft = new Draft({
          channelId: i.channelId,
          count,
          description,
          guildId: i.guildId,
          hostId: i.user.id,
          location,
          skipSignupPing,
          openPool,
          time,
          interaction: i, // TODO can we remove this ref?
        })

        addDraft(draft)

        await draft.initializeNewDraft()

        await i.editReply({ content: 'Draft created' })
      } catch (e) {
        console.log(e)
      }
    }
  }
}

export async function handleDraftAddPlayers(i: CommandInteraction) {
  const users = [
    i.options.getUser('user1'),
    i.options.getUser('user2'),
    i.options.getUser('user3'),
    i.options.getUser('user4'),
    i.options.getUser('user5'),
  ].filter((u) => u)

  getDraft(i)?.addUsers(...(users as User[]))

  await i.reply({ content: `Player${users.length === 1 ? '' : 's'} added`, ephemeral: true })
}

export async function handleDraftRemovePlayers(i: CommandInteraction) {
  const users = [
    i.options.getUser('user1'),
    i.options.getUser('user2'),
    i.options.getUser('user3'),
    i.options.getUser('user4'),
    i.options.getUser('user5'),
  ].filter((u) => u)

  getDraft(i)?.removeUsers(...(users as User[]))

  await i.reply({ content: `Player${users.length === 1 ? '' : 's'} removed`, ephemeral: true })
}

export async function handleDraftReorderPlayer(i: CommandInteraction) {
  const user = i.options.getUser('user', true)

  const position = i.options.getInteger('position', true)

  getDraft(i)?.reorderUser(user, position)

  await i.reply({ content: `Player moved`, ephemeral: true })
}

export async function handleDraftWinner(i: CommandInteraction) {
  const draft = getDraft(i)

  if (!i.guildId) {
    i.reply({ content: 'Invalid guild id', ephemeral: true })
  } else if (!draft) {
    i.reply({ content: 'There is no active draft', ephemeral: true })
  } else {
    const team = i.options.getInteger('team', true)

    draft.winner(team)

    await i.reply({ content: `Team ${team} declared the winner!`, ephemeral: true })
  }
}

export async function handleDraftEdit(i: CommandInteraction) {
  const draft = getDraft(i)

  await draft?.edit(
    i.options.getUser('host'),
    i.options.getString('location'),
    i.options.getString('description'),
    i.options.getBoolean('open_pool'),
  )

  await i.reply({ content: `Draft edited`, ephemeral: true })
}

export async function handleDraftCancel(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    try {
      await draft.cancel()
    } catch (e) {
      console.log(e)
    }

    await removeDraft(draft)

    await i.reply({ content: 'You have cancelled the draft', ephemeral: true })
  } else {
    await i.reply({ content: `There is no active draft to cancel`, ephemeral: true })
  }
}
