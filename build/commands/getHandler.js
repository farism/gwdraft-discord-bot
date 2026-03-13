"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInteractionHandler = void 0;
const handlers_1 = require("./bans/handlers");
const handlers_2 = require("./draft/handlers");
const handlers_3 = require("./player/handlers");
const handlers_4 = require("./preferences/handlers");
const handlers_5 = require("./rank/handlers");
const handlers_6 = require("./settings/handlers");
const handlers_7 = require("./team/handlers");
const handlers_8 = require("./template/handlers");
function getInteractionHandler(i) {
    const subcommand = i.options.getSubcommand(false);
    const key = [i.commandName, subcommand].filter((c) => c).join('_');
    const handlers = {
        rank_profession: handlers_5.handleRankProfession,
        rank_utility: handlers_5.handleRankUtility,
        rank_all: handlers_5.handleRankAll,
        rank_reset: handlers_5.handleRankReset,
        rank_view: handlers_5.handleRankView,
        draft_create: handlers_2.handleDraftCreate,
        draft_add_players: handlers_2.handleDraftAddPlayers,
        draft_remove_players: handlers_2.handleDraftRemovePlayers,
        draft_reorder_player: handlers_2.handleDraftReorderPlayer,
        draft_winner: handlers_2.handleDraftWinner,
        draft_edit: handlers_2.handleDraftEdit,
        draft_cancel: handlers_2.handleDraftCancel,
        draft_ban: handlers_2.handleDraftBan,
        draft_unban: handlers_2.handleDraftUnban,
        draft_banlist: handlers_2.handleDraftBanList,
        team_captain: handlers_7.handleTeamCaptain,
        team_pick: handlers_7.handleTeamPick,
        team_kick: handlers_7.handleTeamKick,
        team_swap: handlers_7.handleTeamSwap,
        team_reset: handlers_7.handleTeamReset,
        bans_skill: handlers_1.handleBanSkill,
        bans_flux: handlers_1.handleBanFlux,
        bans_schedule: handlers_1.handleBanSchedule,
        preferences_set: handlers_4.handlePreferencesSet,
        preferences_reset: handlers_4.handlePreferencesClear,
        preferences_view: handlers_4.handlePreferencesView,
        player_stats: handlers_3.handlePlayerStats,
        player_ign: handlers_3.handlePlayerIgn,
        settings: handlers_6.handleSettings,
        template_skill: handlers_8.handleSkillTemplate,
        template_team: handlers_8.handleTeamTemplate,
    };
    return handlers[key];
}
exports.getInteractionHandler = getInteractionHandler;
//# sourceMappingURL=getHandler.js.map