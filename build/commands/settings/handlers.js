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
exports.handleSettings = void 0;
const firebase_1 = require("../../firebase");
const permissions_1 = require("../permissions");
function handleSettings(i) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!i.guildId) {
            return;
        }
        const s = yield (0, firebase_1.getGuildSettings)(i.guildId);
        const hasAdminRole = (0, permissions_1.userHasRole)(i.guild, i.user.id, (s === null || s === void 0 ? void 0 : s.admin_role) || '0');
        if (((_a = i.guild) === null || _a === void 0 ? void 0 : _a.ownerId) !== i.user.id && !hasAdminRole) {
            i.reply({ content: `You must be the server owner or have an admin role`, ephemeral: true });
            return;
        }
        const doc = yield firebase_1.settings.doc(i.guildId);
        const newSettings = {};
        i.options.data.forEach((opt) => {
            if (opt.value) {
                newSettings[opt.name] = opt.value;
            }
        });
        doc.set(newSettings, { merge: true });
        i.reply({ content: 'Settings have been updated', ephemeral: true });
    });
}
exports.handleSettings = handleSettings;
//# sourceMappingURL=handlers.js.map