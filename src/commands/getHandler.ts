import { CommandInteraction } from 'discord.js'
import { handleBanFlux, handleBanSchedule, handleBanSkill } from './bans/handlers'
import {
  handleDraftAddPlayer,
  handleDraftCancel,
  handleDraftCreate,
  handleDraftEdit,
  handleDraftRemovePlayer,
  handleDraftReorderPlayer,
  handleDraftStart,
  handleDraftWinner,
} from './draft/handlers'
import { handlePlayerIgn, handlePlayerStats } from './player/handlers'
import {
  handlePreferencesClear,
  handlePreferencesSet,
  handlePreferencesView,
} from './preferences/handlers'
import {
  handleRankAll,
  handleRankProfession,
  handleRankReset,
  handleRankUtility,
  handleRankView,
} from './rank/handlers'
import { handleSettings } from './settings/handlers'
import {
  handleTeamCaptain,
  handleTeamKick,
  handleTeamPick,
  handleTeamReset,
  handleTeamSwap,
} from './team/handlers'
import { handleSkillTemplate, handleTeamTemplate } from './template/handlers'

export function getInteractionHandler(i: CommandInteraction) {
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
