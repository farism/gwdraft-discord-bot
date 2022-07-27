import { Client, CommandInteraction, Guild } from 'discord.js'
import { drafts } from '../../firebase'
import { GuildId } from '../../types'
import { deserializeDraft, Draft, DraftDoc } from './draft'

const draftIds: { [k: GuildId]: number } = {}

const draftRegistry: { [k: GuildId]: Draft } = {}

export function nextDraftId(guildId: string) {
  if (draftIds[guildId] !== undefined) {
    draftIds[guildId] = draftIds[guildId] + 1
  } else {
    draftIds[guildId] = 0
  }

  return draftIds[guildId]
}

export function addDraft(draft: Draft) {
  draftRegistry[draft.guildId] = draft
}

export function getDraft(i: CommandInteraction) {
  if (i.guildId) {
    return draftRegistry[i.guildId]
  }
}

export function removeDraft(draft: Draft) {
  delete draftRegistry[draft.guildId]
}

export async function getMessage(guild: Guild, channelId: string, messageId: string) {
  try {
    const channel = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId))

    if (channel?.isText()) {
      let msg = channel.messages.cache.get(messageId)

      if (!msg) {
        msg = await channel.messages.fetch(messageId, { force: true })
      }

      return msg
    }
  } catch (e) {
    console.warn(`Could not get or fetch embed message from ${guild.name}`)
    console.error(e)
  }
}

export async function loadExistingDrafts(client: Client) {
  console.log('Checking for existing drafts...')

  for (let [key, guild] of client.guilds.cache) {
    try {
      const query = await drafts
        .where('guildId', '==', guild.id)
        .where('canceledAt', '==', null)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()

      const doc = query.docs[0]

      if (doc) {
        const data = doc.data() as DraftDoc

        if (data.canceledAt) {
          console.log(`The draft in ${guild.name} has been canceled`)
        } else {
          const msg = await getMessage(guild, data.channelId, data.embedMessageId)

          if (msg) {
            const draft = await deserializeDraft(guild, doc.id, data)

            await draft.initializeExistingDraft()

            addDraft(draft)
          } else {
            console.log(`Could not find embed message for draft in ${guild.name}`)
          }
        }
      }
    } catch (e) {
      console.warn(`Could not fetch draft document for guild ${guild.name}`)
      console.log(e)
    }
  }

  console.log('Existing drafts have been loaded')
}
