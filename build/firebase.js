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
exports.addLossToPlayer = exports.addWinToPlayer = exports.getGuildSettings = exports.defaultRanks = exports.defaultPlayer = exports.players = exports.settings = exports.drafts = exports.bans = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)({
    credential: (0, app_1.applicationDefault)(),
});
const db = (0, firestore_1.getFirestore)();
exports.bans = db.collection('bans');
exports.drafts = db.collection('drafts');
exports.settings = db.collection('settings');
exports.players = db.collection('players');
function defaultPlayer() {
    return {
        wins: 0,
        losses: 0,
        preferences: [],
        rankings: {},
    };
}
exports.defaultPlayer = defaultPlayer;
function defaultRanks(rank = 0) {
    return {
        Assassin: rank,
        Dervish: rank,
        Elementalist: rank,
        Mesmer: rank,
        Monk: rank,
        Necromancer: rank,
        Paragon: rank,
        Ranger: rank,
        Ritualist: rank,
        Warrior: rank,
    };
}
exports.defaultRanks = defaultRanks;
function getGuildSettings(guildId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (guildId) {
            const doc = yield exports.settings.doc(guildId).get();
            return doc.data();
        }
        return null;
    });
}
exports.getGuildSettings = getGuildSettings;
function addWinToPlayer(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = exports.players.doc(id);
        try {
            doc.set({ wins: firestore_1.FieldValue.increment(1) }, { merge: true });
        }
        catch (e) {
            console.log(`Failed adding win to player ${id}`);
            console.log(e);
        }
    });
}
exports.addWinToPlayer = addWinToPlayer;
function addLossToPlayer(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = exports.players.doc(id);
        try {
            doc.set({ losses: firestore_1.FieldValue.increment(1) }, { merge: true });
        }
        catch (e) {
            console.log(`Failed adding loss to player ${id}`);
            console.log(e);
        }
    });
}
exports.addLossToPlayer = addLossToPlayer;
//# sourceMappingURL=firebase.js.map