import { Interaction } from 'discord.js'
import dotenv from 'dotenv'
import { setupClient } from './client'
import { loadExistingDrafts } from './commands/draft/registry'
import { getInteractionHandler } from './commands/getHandler'
import { checkDraftModerator } from './commands/permissions'
import { logCommand, sendAuditLogMessage } from './logging'

// load env variables
dotenv.config()

async function handleInteractions(i: Interaction) {
  if (i.isCommand()) {
    logCommand(i)

    try {
      if (i.commandName === 'draft') {
        sendAuditLogMessage(i)

        if (!(await checkDraftModerator(i))) {
          console.log('Cannot run /draft commands, not a draft moderator')
          return
        }
      }

      const handler = getInteractionHandler(i)

      if (handler) {
        await handler(i)
      }
    } catch (e) {
      console.error(e)
    }
  }
}

// handle commands
; (async () => {
  await setupClient(async (client) => {
    await loadExistingDrafts(client)

    client.on('interactionCreate', handleInteractions)
  })
})()
