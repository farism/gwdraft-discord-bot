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
exports.handlePlayerIgn = exports.handlePlayerStats = void 0;
const firebase_1 = require("../../firebase");
function handlePlayerStats(i) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (!i.guildId) {
            return;
        }
        const doc = yield firebase_1.players.doc(i.user.id).get();
        const data = doc.data();
        const wins = (_a = data === null || data === void 0 ? void 0 : data.wins) !== null && _a !== void 0 ? _a : 0;
        const losses = (_b = data === null || data === void 0 ? void 0 : data.losses) !== null && _b !== void 0 ? _b : 0;
        const winRate = (wins / (wins + (losses || 1))) * 100;
        const content = `Wins: ${wins} | Losses: ${losses} | Win Rate: ${winRate.toFixed(2)}%`;
        i.reply({ content, ephemeral: true });
    });
}
exports.handlePlayerStats = handlePlayerStats;
function handlePlayerIgn(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield firebase_1.players.doc(i.user.id);
        const ign = i.options.getString('name');
        try {
            yield doc.set({ ign }, { merge: true });
        }
        catch (e) {
            console.log('Failed to write ign', i.user.username, ign);
            console.log(e);
        }
        i.reply({ content: `You have set your in-game name`, ephemeral: true });
    });
}
exports.handlePlayerIgn = handlePlayerIgn;
//# sourceMappingURL=handlers.js.map