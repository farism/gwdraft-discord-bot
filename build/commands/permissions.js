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
exports.checkDraftModerator = exports.userHasRole = void 0;
const firebase_1 = require("../firebase");
function userHasRole(guild, userId, roleIdOrName) {
    const member = guild === null || guild === void 0 ? void 0 : guild.members.cache.get(userId);
    return member === null || member === void 0 ? void 0 : member.roles.cache.some((r) => {
        return r.id === roleIdOrName || r.name === roleIdOrName;
    });
}
exports.userHasRole = userHasRole;
function checkDraftModerator(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const guildSettings = yield (0, firebase_1.getGuildSettings)(i.guildId);
        if (guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_moderator_role) {
            if (!userHasRole(i.guild, i.user.id, guildSettings.draft_moderator_role)) {
                i.reply({
                    content: `You must have the <@&${guildSettings.draft_moderator_role}> role`,
                    ephemeral: true,
                });
                return false;
            }
        }
        return true;
    });
}
exports.checkDraftModerator = checkDraftModerator;
//# sourceMappingURL=permissions.js.map