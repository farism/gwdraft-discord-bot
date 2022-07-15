import { CommandInteraction, Formatters } from 'discord.js'
import dotenv from 'dotenv'
import { client, setupClient } from './client'
import { handleBanFlux, handleBanSchedule, handleBanSkill } from './commands/bans/handlers'
import {
  handleDraftAddPlayer,
  handleDraftCancel,
  handleDraftEdit,
  handleDraftMovePlayer,
  handleDraftRemovePlayer,
  handleDraftStart,
} from './commands/draft/handlers'
import {
  handlePreferencesClear,
  handlePreferencesSet,
  handlePreferencesView,
} from './commands/preferences/handlers'
import {
  handleRankAll,
  handleRankProfession,
  handleRankReset,
  handleRankUtility,
  handleRankView,
} from './commands/rank/handlers'
import './firebase'

// load env variables
dotenv.config()

// handle commands
;(async () => {
  try {
    client.on('interactionCreate', async (i) => {
      if (!i.isCommand()) {
        return
      }

      const subcommand = i.options.getSubcommand()

      let handler: ((i: CommandInteraction) => Promise<void>) | null = null

      if (i.commandName === 'rank') {
        if (subcommand === 'profession') {
          handler = handleRankProfession
        } else if (subcommand === 'utility') {
          handler = handleRankUtility
        } else if (subcommand === 'all') {
          handler = handleRankAll
        } else if (subcommand === 'reset') {
          handler = handleRankReset
        } else if (subcommand === 'view') {
          handler = handleRankView
        }
      } else if (i.commandName === 'draft') {
        if (subcommand === 'start') {
          handler = handleDraftStart
        } else if (subcommand === 'addplayer') {
          handler = handleDraftAddPlayer
        } else if (subcommand === 'removeplayer') {
          handler = handleDraftRemovePlayer
        } else if (subcommand === 'moveplayer') {
          handler = handleDraftMovePlayer
        } else if (subcommand === 'edit') {
          handler = handleDraftEdit
        } else if (subcommand === 'cancel') {
          handler = handleDraftCancel
        }
      } else if (i.commandName === 'ban') {
        if (subcommand === 'skill') {
          handler = handleBanSkill
        } else if (subcommand === 'flux') {
          handler = handleBanFlux
        } else if (subcommand === 'schedule') {
          handler = handleBanSchedule
        }
      } else if (i.commandName === 'preferences') {
        if (subcommand === 'set') {
          handler = handlePreferencesSet
        } else if (subcommand === 'reset') {
          handler = handlePreferencesClear
        } else if (subcommand === 'view') {
          handler = handlePreferencesView
        }
      }

      i.options.data.forEach((opt) => {
        opt.options?.forEach((opt) => {
          console.log(opt.name, opt.value)
        })
      })

      if (handler) {
        await handler(i)
      }
    })

    setupClient()
  } catch (error) {
    console.error(error)
  }
})()
