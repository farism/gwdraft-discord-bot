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
exports.handleDraftBanList = exports.handleDraftUnban = exports.handleDraftBan = exports.handleDraftCancel = exports.handleDraftEdit = exports.handleDraftWinner = exports.handleDraftReorderPlayer = exports.handleDraftRemovePlayers = exports.handleDraftAddPlayers = exports.handleDraftCreate = exports.isDraftModerator = void 0;
const firebase_1 = require("../../firebase");
const permissions_1 = require("../permissions");
const draft_1 = require("./draft");
const registry_1 = require("./registry");
function isDraftModerator(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const guildSettings = yield (0, firebase_1.getGuildSettings)(i.guildId);
        const hasRole = (guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_moderator_role)
            ? (0, permissions_1.userHasRole)(i.guild, i.user.id, (guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_moderator_role) || '')
            : true;
        if (!hasRole) {
            yield i.reply({
                content: `You do not have the <@&${guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_moderator_role}> role`,
                ephemeral: true,
            });
        }
        return hasRole;
    });
}
exports.isDraftModerator = isDraftModerator;
function handleDraftCreate(i) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, registry_1.getDraft)(i)) {
            i.reply({
                content: 'Active draft already exists. You need to cancel it first.',
                ephemeral: true,
            });
            return;
        }
        if (!(yield isDraftModerator(i))) {
            return;
        }
        const guildSettings = yield (0, firebase_1.getGuildSettings)(i.guildId);
        const isInDraftChannel = (guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_channel)
            ? guildSettings.draft_channel === ((_a = i.channel) === null || _a === void 0 ? void 0 : _a.id)
            : true;
        if (!isInDraftChannel) {
            yield i.reply({
                content: `Invalid channel, please use <#${guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_channel}>`,
                ephemeral: true,
            });
        }
        else {
            const time = i.options.getString('time');
            const location = i.options.getString('location') || 'Great Temple of Balthazar - AE1';
            const count = i.options.getInteger('count') || 16;
            const description = i.options.getString('description') || '';
            const skipSignupPing = i.options.getBoolean('skip_signup_ping') || false;
            const openPool = i.options.getBoolean('open_pool') || false;
            if (i.guildId) {
                try {
                    yield i.deferReply({ ephemeral: true });
                    const draft = new draft_1.Draft({
                        channelId: i.channelId,
                        count,
                        description,
                        guildId: i.guildId,
                        hostId: i.user.id,
                        location,
                        skipSignupPing,
                        openPool,
                        time,
                        interaction: i,
                    });
                    (0, registry_1.addDraft)(draft);
                    yield draft.initializeNewDraft();
                    yield i.editReply({ content: 'Draft created' });
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
    });
}
exports.handleDraftCreate = handleDraftCreate;
function handleDraftAddPlayers(i) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const users = [
            i.options.getUser('user1'),
            i.options.getUser('user2'),
            i.options.getUser('user3'),
            i.options.getUser('user4'),
            i.options.getUser('user5'),
        ].filter((u) => u);
        (_a = (0, registry_1.getDraft)(i)) === null || _a === void 0 ? void 0 : _a.addUsers(...users);
        yield i.reply({ content: `Player${users.length === 1 ? '' : 's'} added`, ephemeral: true });
    });
}
exports.handleDraftAddPlayers = handleDraftAddPlayers;
function handleDraftRemovePlayers(i) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const users = [
            i.options.getUser('user1'),
            i.options.getUser('user2'),
            i.options.getUser('user3'),
            i.options.getUser('user4'),
            i.options.getUser('user5'),
        ].filter((u) => u);
        (_a = (0, registry_1.getDraft)(i)) === null || _a === void 0 ? void 0 : _a.removeUsers(...users);
        yield i.reply({ content: `Player${users.length === 1 ? '' : 's'} removed`, ephemeral: true });
    });
}
exports.handleDraftRemovePlayers = handleDraftRemovePlayers;
function handleDraftReorderPlayer(i) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const user = i.options.getUser('user', true);
        const position = i.options.getInteger('position', true);
        (_a = (0, registry_1.getDraft)(i)) === null || _a === void 0 ? void 0 : _a.reorderUser(user, position);
        yield i.reply({ content: `Player moved`, ephemeral: true });
    });
}
exports.handleDraftReorderPlayer = handleDraftReorderPlayer;
function handleDraftWinner(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const draft = (0, registry_1.getDraft)(i);
        if (!i.guildId) {
            i.reply({ content: 'Invalid guild id', ephemeral: true });
        }
        else if (!draft) {
            i.reply({ content: 'There is no active draft', ephemeral: true });
        }
        else {
            const team = i.options.getInteger('team', true);
            draft.winner(team);
            yield i.reply({ content: `Team ${team} declared the winner!`, ephemeral: true });
        }
    });
}
exports.handleDraftWinner = handleDraftWinner;
function handleDraftEdit(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const draft = (0, registry_1.getDraft)(i);
        yield (draft === null || draft === void 0 ? void 0 : draft.edit(i.options.getUser('host'), i.options.getString('location'), i.options.getString('description'), i.options.getBoolean('open_pool')));
        yield i.reply({ content: `Draft edited`, ephemeral: true });
    });
}
exports.handleDraftEdit = handleDraftEdit;
function handleDraftCancel(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const draft = (0, registry_1.getDraft)(i);
        if (draft) {
            try {
                yield draft.cancel();
            }
            catch (e) {
                console.log(e);
            }
            yield (0, registry_1.removeDraft)(draft);
            yield i.reply({ content: 'You have cancelled the draft', ephemeral: true });
        }
        else {
            yield i.reply({ content: `There is no active draft to cancel`, ephemeral: true });
        }
    });
}
exports.handleDraftCancel = handleDraftCancel;
function handleDraftBan(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = i.options.getUser('user');
        if ((yield isDraftModerator(i)) && i.guildId && user) {
            const doc = yield firebase_1.bans.doc(i.guildId);
            const data = yield (yield doc.get()).data();
            const users = data ? data.users : [];
            users.push({ id: user.id, username: user.username, date: new Date(), moderator: i.user.username });
            doc.set({ users });
            yield i.reply({ content: `You have banned ${user.username}`, ephemeral: true });
        }
    });
}
exports.handleDraftBan = handleDraftBan;
function handleDraftUnban(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = i.options.getUser('user');
        if ((yield isDraftModerator(i)) && i.guildId && user) {
            const doc = yield firebase_1.bans.doc(i.guildId);
            const data = yield (yield doc.get()).data();
            const users = data ? data.users : [];
            doc.set({ users: users.filter((u) => u.id !== user.id) });
            yield i.reply({ content: `You have unbanned the ${user.username}`, ephemeral: true });
        }
    });
}
exports.handleDraftUnban = handleDraftUnban;
function handleDraftBanList(i) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield isDraftModerator(i)) && i.guildId) {
            const doc = yield (yield firebase_1.bans.doc(i.guildId).get()).data();
            const users = doc ? (doc.users || []) : [];
            if (users.length) {
                const userList = users.map((u) => `username - ${u.username}\nban date - ${u.date.toDate()}`);
                const userListStr = userList.join('\n--------------------------------------------------------------\n');
                yield i.reply({
                    content: `The following players have been banned:\n\n${userListStr}`,
                    ephemeral: true
                });
            }
            else {
                yield i.reply({ content: 'No players have been banned', ephemeral: true });
            }
        }
    });
}
exports.handleDraftBanList = handleDraftBanList;
//# sourceMappingURL=handlers.js.map