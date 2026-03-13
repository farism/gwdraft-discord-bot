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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Draft = exports.deserializeDraft = exports.serializeDraft = void 0;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const discord_js_1 = require("discord.js");
const firebase_admin_1 = require("firebase-admin");
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const text_table_1 = __importDefault(require("text-table"));
const client_1 = require("../../client");
const firebase_1 = require("../../firebase");
const constants_1 = require("../../helpers/constants");
const time_1 = require("../../helpers/time");
const permissions_1 = require("../permissions");
const registry_1 = require("./registry");
function serializeDraft(draft) {
    var _a;
    return {
        channelId: draft.channelId,
        count: draft.count,
        description: draft.description,
        guildId: draft.guildId,
        hostId: draft.hostId,
        location: draft.location,
        openPool: draft.openPool,
        skipSignupPing: draft.skipSignupPing,
        time: draft.time,
        canceledAt: draft.canceledAt,
        date: draft.date,
        guildName: (_a = draft.guild) === null || _a === void 0 ? void 0 : _a.name,
        messages: {
            embed: draft.messages.embed || null,
            opened: draft.messages.opened || null,
            full: draft.messages.full || null,
            canceled: draft.messages.canceled || null,
        },
        teams: Object.entries(draft.teams).reduce((acc, [key, users]) => {
            return Object.assign(Object.assign({}, acc), { [key]: users.map((u) => ({ id: u.id, username: u.username, nickname: u.nickname })) });
        }, {}),
        users: draft.users.map((u) => ({ id: u.id, name: u.username, nickname: u.nickname })),
        usersLog: draft.usersLog,
    };
}
exports.serializeDraft = serializeDraft;
function deserializeDraft(guild, docId, data) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const userIds = (_a = data.users) === null || _a === void 0 ? void 0 : _a.map((u) => (typeof u === 'string' ? u : u.id));
        const membersCollection = yield guild.members.fetch({ user: userIds });
        const draft = new Draft({
            channelId: data.channelId,
            count: data.count,
            description: data.description,
            guildId: data.guildId,
            hostId: data.hostId,
            location: data.location,
            skipSignupPing: data.skipSignupPing,
            openPool: data.openPool,
            time: data.time,
        });
        draft.id = docId;
        draft.date = data.date.toDate();
        draft.messages = data.messages;
        const users = data.users.map((user) => { var _a; return (_a = membersCollection.get(user.id)) === null || _a === void 0 ? void 0 : _a.user; }).filter((u) => u);
        draft.usersLog = data.usersLog;
        draft.addUsers(...users);
        for (let [key, users] of Object.entries(data.teams)) {
            const team = draft.teams[parseInt(key, 10)];
            users.forEach((user) => {
                const id = typeof user === 'string' ? user : user.id;
                const member = membersCollection.get(id);
                if (member) {
                    team.push(member.user);
                }
            });
        }
        return draft;
    });
}
exports.deserializeDraft = deserializeDraft;
class Draft {
    constructor({ hostId, guildId, channelId, time, location, count = constants_1.defaultPlayerCount, description = '', skipSignupPing = false, openPool = false, }) {
        this.canceledAt = null;
        this.date = new Date();
        this.messages = {};
        this.settings = null;
        this.teams = {};
        this.users = [];
        this.usersLog = [];
        this.updateEmbedMessageDebounced = () => { };
        const now = new Date();
        let date = time ? (0, date_fns_tz_1.zonedTimeToUtc)((0, time_1.parseTime)(time), 'Europe/Paris') : now;
        if (date < now) {
            date = (0, date_fns_1.addDays)(date, 1);
        }
        this.channelId = channelId;
        this.count = count;
        this.date = date;
        this.description = description;
        this.guildId = guildId;
        this.hostId = hostId;
        this.location = location;
        this.openPool = openPool;
        this.skipSignupPing = skipSignupPing;
        this.time = time;
        this.updateEmbedMessageDebounced = (0, lodash_debounce_1.default)(this.updateEmbedMessage, (0, date_fns_1.secondsToMilliseconds)(5), {
            leading: true,
            trailing: true,
        });
    }
    initializeNewDraft() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            yield this.initializeTimers();
            yield this.scheduleOpenedMessage();
            yield this.sendEmbedMessage();
            yield this.save();
        });
    }
    initializeExistingDraft() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            yield this.initializeTimers();
            yield this.collectInteractions();
        });
    }
    get guild() {
        return client_1.client.guilds.cache.get(this.guildId);
    }
    get channel() {
        var _a;
        const channel = (_a = this.guild) === null || _a === void 0 ? void 0 : _a.channels.cache.get(this.channelId);
        if (channel === null || channel === void 0 ? void 0 : channel.isText()) {
            return channel;
        }
    }
    get signupDate() {
        return (0, date_fns_1.subHours)(this.date, 1);
    }
    initializeTimers() {
        this.userLogTimer = setInterval(() => this.updateUserLog(), (0, date_fns_1.secondsToMilliseconds)(1));
    }
    get isPastSignupTime() {
        return new Date() > this.signupDate;
    }
    get isPastStartTime() {
        return new Date() > this.date;
    }
    get usersInCount() {
        return this.users.slice(0, this.count);
    }
    scheduleOpenedMessage() {
        const diff = (0, date_fns_1.differenceInMilliseconds)(new Date(), this.signupDate);
        const timeout = diff < 0 ? Math.abs(diff) : 0;
        this.openedTimer = setTimeout(() => this.sendOpenedMessage('Sign-ups are open, register now!'), timeout);
    }
    timestamp(date) {
        return Math.floor(date.getTime() / 1000);
    }
    isUserOnTeam(user, team) {
        var _a;
        return !!((_a = this.teams[team]) === null || _a === void 0 ? void 0 : _a.find((u) => u.id === user.id));
    }
    loadSettings() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.settings = yield (0, firebase_1.getGuildSettings)(this.guildId);
            }
            catch (e) {
                console.log(`Failed to load settings for guild ${(_a = this.guild) === null || _a === void 0 ? void 0 : _a.name}`);
            }
        });
    }
    getMessage(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.guild && id) {
                return yield (0, registry_1.getMessage)(this.guild, this.channelId, id);
            }
        });
    }
    getNickname(user) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let member = (_a = this.guild) === null || _a === void 0 ? void 0 : _a.members.cache.get(user.id);
            if (!member) {
                member = yield ((_b = this.guild) === null || _b === void 0 ? void 0 : _b.members.fetch(user.id));
            }
            return (member === null || member === void 0 ? void 0 : member.nickname) || user.username;
        });
    }
    createComponents() {
        const row = new discord_js_1.MessageActionRow();
        row.addComponents(new discord_js_1.MessageButton()
            .setCustomId('join')
            .setLabel('Join')
            .setStyle(!this.isPastSignupTime ? 'SECONDARY' : 'PRIMARY')
            .setDisabled(!this.isPastSignupTime), new discord_js_1.MessageButton()
            .setCustomId('leave')
            .setLabel('Leave')
            .setStyle('SECONDARY')
            .setDisabled(!this.isPastSignupTime));
        return row;
    }
    createEmbed() {
        return __awaiter(this, void 0, void 0, function* () {
            const divider = (i) => (i === this.count ? '-----\n' : '');
            const signups = [];
            for (const [i, user] of this.users.entries()) {
                const doc = yield (yield firebase_1.players.doc(user.id).get()).data();
                const ign = (doc === null || doc === void 0 ? void 0 : doc.ign) ? ` (${doc.ign})` : '';
                const str = this.openPool
                    ? `- ${user.nickname}${ign}`
                    : `${divider(i)}${i + 1}. ${user.nickname}${ign}`;
                signups.push(str.replace(/_/g, '\\_'));
            }
            const embed = new discord_js_1.MessageEmbed();
            embed.addField('Start Time', this.isPastStartTime
                ? `~~<t:${this.timestamp(this.date)}>~~ In Progress`
                : `<t:${this.timestamp(this.date)}>`);
            if (!this.isPastSignupTime) {
                embed.addField('Sign-ups begin at', `<t:${this.timestamp(this.signupDate)}>`);
            }
            embed.addField('Meeting Location', this.location);
            embed.addField('Draft Type', this.openPool
                ? 'Open Pool - Captains can pick anyone'
                : 'Closed Pool - Captains can pick from the first 16');
            if (this.description) {
                embed.addField('Description', this.description);
            }
            embed
                .addField('Player Count', `${this.users.length} / ${this.count}`)
                .addField('Host', `<@${this.hostId}>`)
                .addField('Signups', `${signups.length ? signups.join('\n') : 'None'}`);
            Object.keys(this.teams)
                .sort()
                .forEach((key) => {
                var _a;
                const t = ((_a = this.teams[parseInt(key, 10)]) === null || _a === void 0 ? void 0 : _a.map((u, i) => `${i + 1}. ${u.nickname}`).join('\n')) ||
                    'None';
                if (t) {
                    embed.addField(`Team ${key}`, t, true);
                }
            });
            return embed;
        });
    }
    sendEmbedMessage() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.channel) === null || _a === void 0 ? void 0 : _a.isText())) {
                throw new Error('Draft must be created in a text channel');
            }
            const embed = yield this.createEmbed();
            const msg = yield this.channel.send({
                content: `A draft has been ${this.time ? 'scheduled' : 'created'}`,
                embeds: [embed],
                components: [this.createComponents()],
            });
            if (msg) {
                this.messages.embed = msg.id;
                this.collectInteractions();
            }
        });
    }
    updateEmbedMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const message = yield this.getMessage(this.messages.embed);
                if (message === null || message === void 0 ? void 0 : message.editable) {
                    const embed = yield this.createEmbed();
                    if (this.canceledAt) {
                        yield (message === null || message === void 0 ? void 0 : message.edit({
                            content: 'The draft has been canceled',
                            embeds: [],
                            components: [],
                        }));
                    }
                    else {
                        yield (message === null || message === void 0 ? void 0 : message.edit({
                            embeds: [embed],
                            components: [this.createComponents()],
                        }));
                    }
                }
            }
            catch (e) {
                console.log('Failed to update message');
                console.log(e);
            }
        });
    }
    sendOpenedMessage(content) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.settings) === null || _a === void 0 ? void 0 : _a.draft_player_role) || this.skipSignupPing) {
                return;
            }
            if (this.messages.opened) {
                const msg = yield this.getMessage(this.messages.opened);
                if (msg === null || msg === void 0 ? void 0 : msg.deletable) {
                    msg.delete();
                }
            }
            try {
                const openedMessage = yield ((_b = this.channel) === null || _b === void 0 ? void 0 : _b.send(`${content} <@&${this.settings.draft_player_role}>`));
                this.messages.opened = (openedMessage === null || openedMessage === void 0 ? void 0 : openedMessage.id) || null;
                this.save();
            }
            catch (e) {
                console.log(`Failed to send opened message to ${(_c = this.channel) === null || _c === void 0 ? void 0 : _c.name}`);
                console.log(e);
            }
        });
    }
    sendFullMessage() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.settings) === null || _a === void 0 ? void 0 : _a.draft_player_role) || this.skipSignupPing || this.messages.full) {
                return;
            }
            const mentions = this.usersInCount.map((u) => `<@${u.id}>`).join(' ');
            try {
                const fullMsg = yield ((_b = this.channel) === null || _b === void 0 ? void 0 : _b.send(`The draft has enough players, please come to ${this.location} <@&${this.settings.draft_player_role}> ${mentions}`));
                this.messages.full = (fullMsg === null || fullMsg === void 0 ? void 0 : fullMsg.id) || null;
                this.save();
            }
            catch (e) {
                console.log(`Failed to send draft full message to ${(_c = this.channel) === null || _c === void 0 ? void 0 : _c.name}`);
                console.log(e);
            }
        });
    }
    createUserLog() {
        const log = this.usersLog.map((u, i) => {
            const did = (0, date_fns_1.intervalToDuration)({ start: 0, end: u.durationInDraft });
            const dic = (0, date_fns_1.intervalToDuration)({ start: 0, end: u.durationInCount });
            const f = (n = 0) => String(n).padStart(2, '0');
            return [
                `${i + 1}.`,
                u.nickname || u.username,
                `${f(did.hours)}:${f(did.minutes)}`,
                `${f(dic.hours)}:${f(dic.minutes)}`,
            ];
        });
        const t = (0, text_table_1.default)([['', 'Name', '     In Draft', '     In Count'], ['', '', '', '', ''], ...log], {
            align: ['l', 'l', 'r', 'r'],
        });
        return '```' + t + '```';
    }
    sendCanceledMessage() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const draftDuration = (0, date_fns_1.intervalToDuration)({
                start: 0,
                end: (0, date_fns_1.differenceInMilliseconds)(new Date(), this.date),
            });
            const content = [
                `Draft has been canceled after ${(0, date_fns_1.formatDuration)(draftDuration, {
                    format: ['hours', 'minutes'],
                })}`,
            ];
            if (this.usersLog.length > 0) {
                content.push(this.createUserLog());
            }
            try {
                const canceledMsg = yield ((_a = this.channel) === null || _a === void 0 ? void 0 : _a.send({ content: content.join('\n') }));
                if (canceledMsg) {
                    this.messages.canceled = canceledMsg.id;
                }
                setTimeout(() => {
                    try {
                        (canceledMsg === null || canceledMsg === void 0 ? void 0 : canceledMsg.deletable) && canceledMsg.delete();
                    }
                    catch (e) {
                        console.log('Could not delete canceled message');
                        console.log(e);
                    }
                }, (0, date_fns_1.minutesToMilliseconds)(60));
            }
            catch (e) {
                console.log(`Failed to send canceled message to ${(_b = this.channel) === null || _b === void 0 ? void 0 : _b.name}`);
                console.log(e);
            }
        });
    }
    updateUserLog() {
        if (!this.isPastStartTime) {
            return;
        }
        this.users.forEach((u) => {
            const log = this.usersLog.find((ul) => ul.id === u.id);
            if (log) {
                log.durationInDraft += (0, date_fns_1.secondsToMilliseconds)(1);
                if (this.isUserInCount(u)) {
                    log.durationInCount += (0, date_fns_1.secondsToMilliseconds)(1);
                }
            }
        });
    }
    collectInteractions() {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield this.getMessage(this.messages.embed);
            if (message) {
                const collector = message.createMessageComponentCollector({
                    dispose: true,
                    time: (0, date_fns_1.hoursToMilliseconds)(72),
                });
                collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
                    if (i.customId === 'join') {
                        if (this.isUserInDraft(i.user)) {
                            yield i.reply({ content: `You have already joined the draft`, ephemeral: true });
                        }
                        else {
                            if (yield this.isUserBanned(i.user.id)) {
                                yield i.reply({ content: `You are banned from drafts!`, ephemeral: true });
                            }
                            else {
                                yield this.addUsers(i.user);
                                yield i.reply({ content: `You have joined the draft!`, ephemeral: true });
                            }
                        }
                    }
                    else if (i.customId === 'leave') {
                        if (this.isUserInDraft(i.user)) {
                            yield this.removeUsers(i.user);
                            i.reply({ content: `You have left the draft`, ephemeral: true });
                        }
                        else {
                            yield i.reply({ content: `You are not in the draft`, ephemeral: true });
                        }
                    }
                }));
            }
        });
    }
    isUserBanned(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = (yield (yield firebase_1.bans.doc(this.guildId).get()).data()) || {};
            const users = doc.users || [];
            return users.some((u) => u.id === id);
        });
    }
    isUserInDraft(user) {
        return this.users.findIndex((u) => u.id === user.id) >= 0;
    }
    isUserInCount(user) {
        return !!this.usersInCount.find((u) => u.id === user.id);
    }
    isUserAModerator(user) {
        var _a;
        if (this.guild) {
            return (0, permissions_1.userHasRole)(this.guild, user.id, ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.draft_moderator_role) || '');
        }
        return false;
    }
    isUserACaptain(user) {
        return Object.values(this.teams).some((team) => team.some((u, i) => u.id === user.id && i === 0));
    }
    isUserOnATeam(user) {
        return Object.values(this.teams).some((t) => t.some((u) => u.id === user.id));
    }
    addUsers(...users) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let user of users) {
                if (user && !this.isUserInDraft(user)) {
                    user.nickname = yield this.getNickname(user);
                    this.users = [...this.users, user];
                }
                if (!this.usersLog.find((u) => u.id === user.id)) {
                    this.usersLog.push({
                        id: user.id,
                        username: user.username,
                        nickname: user.nickname,
                        durationInDraft: 0,
                        durationInCount: 0,
                    });
                }
            }
            if (this.users.length >= this.count && !this.fullTimer) {
                this.fullTimer = setTimeout(() => this.sendFullMessage(), (0, date_fns_1.minutesToMilliseconds)(1));
            }
            this.save();
        });
    }
    removeUsers(...users) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let user of users) {
                this.users = this.users.filter((u) => u.id !== user.id);
                Object.keys(this.teams).forEach((key) => {
                    var _a, _b;
                    const team = parseInt(key, 10);
                    this.teams[team] = (_b = (_a = this.teams[team]) === null || _a === void 0 ? void 0 : _a.filter((u) => u.id !== user.id)) !== null && _b !== void 0 ? _b : [];
                });
            }
            if (this.users.length < this.count) {
                clearTimeout(this.fullTimer);
                this.fullTimer = undefined;
            }
            this.save();
        });
    }
    reorderUser(user, position) {
        return __awaiter(this, void 0, void 0, function* () {
            this.users = this.users.filter((u) => u.id !== user.id);
            this.users.splice(position - 1, 0, user);
            this.save();
        });
    }
    setTeamCaptain(user, team) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.teams[team]) === null || _a === void 0 ? void 0 : _a.unshift(user);
            this.save();
        });
    }
    addUserToTeam(user, team) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isUserInCount(user) && !this.isUserOnTeam(user, team)) {
                (_a = this.teams[team]) === null || _a === void 0 ? void 0 : _a.push(user);
            }
            this.save();
        });
    }
    removeUserFromTeam(user, team) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.teams[team] = (_b = (_a = this.teams[team]) === null || _a === void 0 ? void 0 : _a.filter((u) => u.id !== user.id)) !== null && _b !== void 0 ? _b : [];
            this.save();
        });
    }
    swapUserTeam(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isUserOnTeam(user, 1)) {
                this.removeUserFromTeam(user, 1);
                this.addUserToTeam(user, 2);
            }
            else if (this.isUserOnTeam(user, 2)) {
                this.removeUserFromTeam(user, 2);
                this.addUserToTeam(user, 1);
            }
            this.save();
        });
    }
    addUserToCaptainsTeam(captain, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isUserOnTeam(captain, 1)) {
                this.addUserToTeam(user, 1);
            }
            else if (this.isUserOnTeam(captain, 2)) {
                this.addUserToTeam(user, 2);
            }
            this.save();
        });
    }
    removeUserFromCaptainsTeam(captain, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isUserOnTeam(captain, 1)) {
                this.removeUserFromTeam(user, 1);
            }
            else if (this.isUserOnTeam(captain, 2)) {
                this.removeUserFromTeam(user, 2);
            }
            this.save();
        });
    }
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            clearTimeout(this.openedTimer || undefined);
            clearTimeout(this.userLogTimer || undefined);
            clearTimeout(this.fullTimer || undefined);
            const embedMessage = yield this.getMessage(this.messages.embed);
            const openedMessage = yield this.getMessage(this.messages.opened);
            const fullMsg = yield this.getMessage(this.messages.full);
            yield this.sendCanceledMessage();
            this.canceledAt = new Date();
            this.save(false);
            if (embedMessage === null || embedMessage === void 0 ? void 0 : embedMessage.deletable) {
                embedMessage.delete();
            }
            if (openedMessage === null || openedMessage === void 0 ? void 0 : openedMessage.deletable) {
                openedMessage.delete();
            }
            if (fullMsg === null || fullMsg === void 0 ? void 0 : fullMsg.deletable) {
                fullMsg.delete();
            }
        });
    }
    save(updateEmbed = true) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = serializeDraft(this);
            try {
                if (this.id) {
                    yield ((_a = firebase_1.drafts.doc(this.id)) === null || _a === void 0 ? void 0 : _a.set(data, { merge: true }));
                }
                else {
                    const doc = firebase_1.drafts.doc();
                    yield doc.set(Object.assign(Object.assign({}, data), { createdAt: firebase_admin_1.firestore.Timestamp.now() }));
                    this.id = doc.id;
                }
                if (updateEmbed) {
                    this.updateEmbedMessageDebounced();
                }
            }
            catch (e) {
                console.log('Draft failed to save');
                console.log(e);
            }
        });
    }
    edit(host, location, description, openPool) {
        return __awaiter(this, void 0, void 0, function* () {
            if (host) {
                this.hostId = host.id;
            }
            if (location) {
                this.location = location;
            }
            if (description) {
                this.description = description;
            }
            if (openPool !== null) {
                this.openPool = openPool;
            }
            this.save();
        });
    }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            this.teams = {};
            this.save();
        });
    }
    winner(team) {
        return __awaiter(this, void 0, void 0, function* () {
            if (team === 1) {
                this.teams[1].forEach((u) => (0, firebase_1.addWinToPlayer)(u.id));
                this.teams[2].forEach((u) => (0, firebase_1.addLossToPlayer)(u.id));
            }
            else if (team === 2) {
                this.teams[1].forEach((u) => (0, firebase_1.addLossToPlayer)(u.id));
                this.teams[2].forEach((u) => (0, firebase_1.addWinToPlayer)(u.id));
            }
        });
    }
}
exports.Draft = Draft;
//# sourceMappingURL=draft.js.map