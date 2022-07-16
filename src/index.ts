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
import { handleSkillTemplate, handleTeamTemplate } from './commands/template/handlers'
import './firebase'
import { getGuildSettings } from './firebase'
import { checkDraftModerator } from './commands/helpers'

// load env variables
dotenv.config()

function getHandler(i: CommandInteraction) {
  const subcommand = i.options.getSubcommand(false)

  const key = [i.commandName, subcommand].filter((c) => c).join('_')

  const handlers = {
    rank_profession: handleRankProfession,
    rank_utility: handleRankUtility,
    rank_all: handleRankAll,
    rank_reset: handleRankReset,
    rank_view: handleRankView,

    draft_create: handleDraftCreate,
    draft_start: handleDraftStart,
    draft_add_player: handleDraftAddPlayer,
    draft_remove_player: handleDraftRemovePlayer,
    draft_reorder_player: handleDraftReorderPlayer,
    draft_winner: handleDraftWinner,
    draft_edit: handleDraftEdit,
    draft_cancel: handleDraftCancel,

    team_captain: handleTeamCaptain,
    team_pick: handleTeamPick,
    team_kick: handleTeamKick,
    team_swap: handleTeamSwap,
    team_reset: handleTeamReset,

    bans_skill: handleBanSkill,
    bans_flux: handleBanFlux,
    bans_schedule: handleBanSchedule,

    preferences_set: handlePreferencesSet,
    preferences_reset: handlePreferencesClear,
    preferences_view: handlePreferencesView,

    player_stats: handlePlayerStats,
    player_ign: handlePlayerIgn,

    settings: handleSettings,

    template_skill: handleSkillTemplate,
    template_team: handleTeamTemplate,
  }

  return handlers[key as keyof typeof handlers]
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
  setupClient()

  client.on('interactionCreate', async (i) => {
    try {
      if (!i.isCommand() || (i.commandName === 'draft' && !(await checkDraftModerator(i)))) {
        return
      }

      if (i.commandName === 'draft') {
        logDraftCommand(i)
      }

      const handler = getHandler(i)

      if (handler) {
        await handler(i)
      }
    } catch (e) {
      console.error(e)
    }
  })
})()
