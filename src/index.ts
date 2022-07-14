import { client, login, updateCommands } from './client'
import { handleBanFlux, handleBanSchedule, handleBanSkill } from './commands/ban'
import { handleDraftCancel, handleDraftRemovePlayer, handleDraftStart } from './commands/draft'
import {
  handlePreferencesClear,
  handlePreferencesSet,
  handlePreferencesView,
} from './commands/preferences'
import {
  handleRankAll,
  handleRankProfession,
  handleRankReset,
  handleRankUtility,
  handleRankView,
} from './commands/rank'
import './firebase'
;(async () => {
  try {
    client.on('interactionCreate', async (i) => {
      if (!i.isCommand()) {
        return
      }

      const judgeRole = i.guild?.roles.cache.find((role) => role.name === 'draft-judge')

      if (judgeRole) {
        // const judges = members?.filter((member) => true)
      }

      const subcommandName = i.options.getSubcommand()

      if (i.commandName === 'rank') {
        if (subcommandName === 'profession') {
          await handleRankProfession(i)
        } else if (subcommandName === 'utility') {
          await handleRankUtility(i)
        } else if (subcommandName === 'all') {
          await handleRankAll(i)
        } else if (subcommandName === 'reset') {
          await handleRankReset(i)
        } else if (subcommandName === 'view') {
          await handleRankView(i)
        }
      } else if (i.commandName === 'draft') {
        if (subcommandName === 'start') {
          await handleDraftStart(i)
        } else if (subcommandName === 'removeplayer') {
          await handleDraftRemovePlayer(i)
        } else if (subcommandName === 'cancel') {
          await handleDraftCancel(i)
        }
      } else if (i.commandName === 'ban') {
        if (subcommandName === 'skill') {
          await handleBanSkill(i)
        } else if (subcommandName === 'flux') {
          await handleBanFlux(i)
        } else if (subcommandName === 'schedule') {
          await handleBanSchedule(i)
        }
      } else if (i.commandName === 'preferences') {
        if (subcommandName === 'set') {
          await handlePreferencesSet(i)
        } else if (subcommandName === 'reset') {
          await handlePreferencesClear(i)
        } else if (subcommandName === 'view') {
          await handlePreferencesView(i)
        }
      }
    })

    updateCommands()
    login()
  } catch (error) {
    console.error(error)
  }
})()
