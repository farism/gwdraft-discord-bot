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
exports.handleRankView = exports.handleRankReset = exports.handleRankUtility = exports.handleRankAll = exports.handleRankProfession = exports.rankChoices = exports.professionChoices = void 0;
const firebase_1 = require("../../firebase");
const types_1 = require("../../types");
function formatRankings(rankings) {
    return '';
}
exports.professionChoices = Object.entries(types_1.Profession).map(([name, value]) => ({
    name,
    value,
}));
exports.rankChoices = [
    { name: '1', value: 1 },
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
];
function createRankingPayload(i, payload) {
    var _a;
    if (!i.guildId) {
        return {};
    }
    return {
        userName: i.options.getUser('user', true).username,
        ranking: {
            [i.guildId]: {
                guildName: (_a = i.guild) === null || _a === void 0 ? void 0 : _a.name,
                [i.user.id]: Object.assign({ judgeName: i.user.username }, payload),
            },
        },
    };
}
function handleRankProfession(i) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!i.guildId) {
            return;
        }
        const user = i.options.getUser('user', true);
        const profession = i.options.getString('profession', true);
        const rank = i.options.getInteger('rank', true);
        const payload = createRankingPayload(i, { [profession]: rank });
        yield firebase_1.players.doc(user.id).set(payload, { merge: true });
        i.reply({ content: 'used /rank profession', ephemeral: true });
    });
}
exports.handleRankProfession = handleRankProfession;
function handleRankAll(i) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!i.guildId) {
            return;
        }
        const user = i.options.getUser('user', true);
        const rank = i.options.getInteger('rank', true);
        const payload = createRankingPayload(i, (0, firebase_1.defaultRanks)(rank));
        yield firebase_1.players.doc(user.id).set(payload, { merge: true });
        i.reply({ content: 'used /rank all', ephemeral: true });
    });
}
exports.handleRankAll = handleRankAll;
function handleRankUtility(i) {
    return __awaiter(this, void 0, void 0, function* () {
        i.reply({ content: 'used /rank utility', ephemeral: true });
    });
}
exports.handleRankUtility = handleRankUtility;
function handleRankReset(i) {
    return __awaiter(this, void 0, void 0, function* () {
        i.reply({ content: 'used /rank reset', ephemeral: true });
    });
}
exports.handleRankReset = handleRankReset;
function getRankings(i) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const user = i.options.getUser('user', true);
        const doc = yield firebase_1.players.doc(user.id).get();
        if (i.guildId) {
            return (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.ranking[i.guildId][i.user.id];
        }
        return {};
    });
}
function handleRankView(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const rankings = yield getRankings(i);
        i.reply({ content: formatRankings(rankings), ephemeral: true });
    });
}
exports.handleRankView = handleRankView;
//# sourceMappingURL=handlers.js.map