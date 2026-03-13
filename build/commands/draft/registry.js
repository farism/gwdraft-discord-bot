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
exports.loadExistingDrafts = exports.getMessage = exports.removeDraft = exports.getDraft = exports.addDraft = void 0;
const firebase_1 = require("../../firebase");
const draft_1 = require("./draft");
const draftRegistry = {};
function addDraft(draft) {
    draftRegistry[draft.guildId] = draft;
}
exports.addDraft = addDraft;
function getDraft(i) {
    if (i.guildId) {
        return draftRegistry[i.guildId];
    }
}
exports.getDraft = getDraft;
function removeDraft(draft) {
    delete draftRegistry[draft.guildId];
}
exports.removeDraft = removeDraft;
function getMessage(guild, channelId, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const channel = guild.channels.cache.get(channelId) || (yield guild.channels.fetch(channelId));
            if (channel === null || channel === void 0 ? void 0 : channel.isText()) {
                let msg = channel.messages.cache.get(messageId);
                if (!msg) {
                    msg = yield channel.messages.fetch(messageId, { force: true });
                }
                return msg;
            }
        }
        catch (e) {
            console.warn(`Could not get or fetch embed message from ${guild.name}`);
            console.error(e);
        }
    });
}
exports.getMessage = getMessage;
function loadExistingDrafts(client) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Checking for existing drafts...');
        for (let [key, guild] of client.guilds.cache) {
            try {
                const query = yield firebase_1.drafts
                    .where('guildId', '==', guild.id)
                    .where('canceledAt', '==', null)
                    .orderBy('createdAt', 'desc')
                    .limit(1)
                    .get();
                const doc = query.docs[0];
                if (doc) {
                    const data = doc.data();
                    if (data.canceledAt) {
                        console.log(`The draft in ${guild.name} has been canceled`);
                    }
                    else {
                        const msg = yield getMessage(guild, data.channelId, data.messages.embed);
                        if (msg) {
                            const draft = yield (0, draft_1.deserializeDraft)(guild, doc.id, data);
                            yield draft.initializeExistingDraft();
                            addDraft(draft);
                        }
                        else {
                            console.log(`Could not find embed message for draft in ${guild.name}`);
                        }
                    }
                }
            }
            catch (e) {
                console.warn(`Could not fetch draft document for guild ${guild.name}`);
                console.log(e);
            }
        }
        console.log('Existing drafts have been loaded');
    });
}
exports.loadExistingDrafts = loadExistingDrafts;
//# sourceMappingURL=registry.js.map