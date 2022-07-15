import { CommandInteraction } from 'discord.js'
import dotenv from 'dotenv'
import { client, setupClient } from './client'
import { handleBanFlux, handleBanSchedule, handleBanSkill } from './commands/bans/handlers'
import {
  handleDraftAddPlayer,
  handleDraftCancel,
  handleDraftCreate,
  handleDraftEdit,
  handleDraftRemovePlayer,
  handleDraftReorderPlayer,
  handleDraftStart,
  handleDraftWinner,
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
import { handleSettings } from './commands/settings/handlers'
import { handlePlayerIgn, handlePlayerStats } from './commands/player/handlers'
import {
  handleTeamCaptain,
  handleTeamKick,
  handleTeamPick,
  handleTeamReset,
  handleTeamSwap,
} from './commands/team/handlers'
import { handleSkillTemplate } from './commands/template/handlers'
import './firebase'
import { getGuildSettings } from './firebase'

// load env variables
dotenv.config()

function getHandler(i: CommandInteraction) {
  let handler: ((i: CommandInteraction) => Promise<void>) | null = null

  const subcommand = i.options.getSubcommand(false)

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
    if (subcommand === 'create') {
      handler = handleDraftCreate
    } else if (subcommand === 'start') {
      handler = handleDraftStart
    } else if (subcommand === 'add_player') {
      handler = handleDraftAddPlayer
    } else if (subcommand === 'remove_player') {
      handler = handleDraftRemovePlayer
    } else if (subcommand === 'reorder_player') {
      handler = handleDraftReorderPlayer
    } else if (subcommand === 'winner') {
      handler = handleDraftWinner
    } else if (subcommand === 'edit') {
      handler = handleDraftEdit
    } else if (subcommand === 'cancel') {
      handler = handleDraftCancel
    }
  } else if (i.commandName === 'team') {
    if (subcommand === 'captain') {
      handler = handleTeamCaptain
    } else if (subcommand === 'pick') {
      handler = handleTeamPick
    } else if (subcommand === 'kick') {
      handler = handleTeamKick
    } else if (subcommand === 'swap') {
      handler = handleTeamSwap
    } else if (subcommand === 'reset') {
      handler = handleTeamReset
    }
  } else if (i.commandName === 'bans') {
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
  } else if (i.commandName === 'player') {
    if (subcommand === 'stats') {
      handler = handlePlayerStats
    } else if (subcommand === 'ign') {
      handler = handlePlayerIgn
    }
  } else if (i.commandName === 'settings') {
    handler = handleSettings
  } else if (i.commandName === 'template') {
    if (subcommand === 'skill') {
      handler = handleSkillTemplate
    }
  }

  return handler
}

async function logDraftCommand(i: CommandInteraction) {
  const command = i.commandName
  const subcommand = i.options.getSubcommand()
  const options: string[] = []
  const user = i.user.username
  const guildSettings = await getGuildSettings(i)

  if (subcommand) {
    i.options.data.forEach((opt) => {
      opt.options?.forEach((opt) => {
        let value = opt.value
        if (opt.type === 'USER') {
          value = i.guild?.members.cache.get(String(opt.value))?.user.username
        }
        options.push(`  ${opt.name} = ${value}`)
      })
    })
  }

  if (guildSettings?.draft_audit_log_channel) {
    const msg = [
      `command: /${command} ${subcommand}`,
      `executed by: ${user}`,
      'parameters:',
      `${options.join('\n')}`,
    ].join('\n')

    const channel = i.guild?.channels.cache.get(guildSettings?.draft_audit_log_channel)

    if (channel?.isText()) {
      channel.send('```' + msg + '```')
    }
  }
}

// handle commands
;(async () => {
  try {
    setupClient()

    client.on('interactionCreate', async (i) => {
      if (!i.isCommand()) {
        return
      }

      if (i.commandName === 'draft') {
        logDraftCommand(i)
      }

      const handler = getHandler(i)

      if (handler) {
        await handler(i)
      }
    })
  } catch (error) {
    console.error(error)
  }
})()
