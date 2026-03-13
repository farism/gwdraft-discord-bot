"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTeamReset = exports.handleTeamSwap = exports.handleTeamKick = exports.handleTeamPick = exports.handleTeamCaptain = void 0;
const registry_1 = require("../draft/registry");
const permissions_1 = require("../permissions");
function handleTeamCaptain(i) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield (0, permissions_1.checkDraftModerator)(i))) {
            return;
        }
        const draft = (0, registry_1.getDraft)(i);
        if (draft) {
            const user = i.options.getUser('user', true);
            const team = i.options.getInteger('team', true);
            if (!draft.isUserInCount(user)) {
                yield i.reply({ content: `This player is not in the count`, ephemeral: true });
            }
            else if (draft.isUserACaptain(user)) {
                yield i.reply({ content: `This player is already a captain`, ephemeral: true });
            }
            else {
                draft.setTeamCaptain(user, team);
                yield i.reply({ content: `You have assigned a team captain`, ephemeral: true });
            }
        }
        else {
            yield i.reply({ content: `There is no active draft`, ephemeral: true });
        }
    });
}
exports.handleTeamCaptain = handleTeamCaptain;
function handleTeamPick(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const draft = (0, registry_1.getDraft)(i);
        if (draft) {
            const user = i.options.getUser('user', true);
            if (!draft.isUserInCount(user)) {
                yield i.reply({ content: `This player is not in the count`, ephemeral: true });
            }
            else if (draft.isUserOnATeam(user)) {
                yield i.reply({ content: `This player is already on a team`, ephemeral: true });
            }
            else if (draft.isUserACaptain(i.user)) {
                draft.addUserToCaptainsTeam(i.user, user);
                yield i.reply({ content: `Player picked`, ephemeral: true });
            }
            else if (draft.isUserAModerator(i.user)) {
                draft.addUserToTeam(user, i.options.getInteger('team') || 0);
                yield i.reply({ content: `Player assigned to team`, ephemeral: true });
            }
            else {
                yield i.reply({
                    content: `You are not a captain or draft moderator, cannot pick players`,
                    ephemeral: true,
                });
            }
        }
        else {
            yield i.reply({ content: `There is no active draft`, ephemeral: true });
        }
    });
}
exports.handleTeamPick = handleTeamPick;
function handleTeamKick(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const draft = (0, registry_1.getDraft)(i);
        if (draft) {
            const user = i.options.getUser('user', true);
            if (draft.isUserACaptain(i.user)) {
                draft.removeUserFromCaptainsTeam(i.user, user);
                yield i.reply({ content: `Player kicked`, ephemeral: true });
            }
            else if (draft.isUserAModerator(i.user)) {
                draft.removeUserFromTeam(user, i.options.getInteger('team') || 0);
                yield i.reply({ content: `Player removed from team`, ephemeral: true });
            }
            else {
                yield i.reply({
                    content: `You are not a captain or draft moderator, cannot kick players`,
                    ephemeral: true,
                });
            }
        }
        else {
            yield i.reply({ content: `There is no active draft`, ephemeral: true });
        }
    });
}
exports.handleTeamKick = handleTeamKick;
function handleTeamSwap(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const draft = (0, registry_1.getDraft)(i);
        if (draft) {
            const user = i.options.getUser('user', true);
            if (draft.isUserAModerator(i.user) || draft.isUserACaptain(i.user)) {
                draft.swapUserTeam(user);
                yield i.reply({ content: `Player swapped`, ephemeral: true });
            }
            else {
                yield i.reply({
                    content: `Only draft moderators or captains can swap players`,
                    ephemeral: true,
                });
            }
        }
        else {
            yield i.reply({ content: `There is no active draft`, ephemeral: true });
        }
    });
}
exports.handleTeamSwap = handleTeamSwap;
function handleTeamReset(i) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield (0, permissions_1.checkDraftModerator)(i))) {
            return;
        }
        const draft = (0, registry_1.getDraft)(i);
        if (draft) {
            draft.reset();
            yield i.reply({ content: `The teams have been reset` });
        }
        else {
            yield i.reply({ content: `There is no active draft`, ephemeral: true });
        }
    });
}
exports.handleTeamReset = handleTeamReset;
//# sourceMappingURL=handlers.js.map