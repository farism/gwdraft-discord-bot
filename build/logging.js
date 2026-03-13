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
exports.sendAuditLogMessage = exports.logCommand = void 0;
const firebase_1 = require("./firebase");
function logCommand(i) {
    var _a, _b, _c;
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`A command was received`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`User        : ${i.user.username}`);
    console.log(`Guild       : ${(_a = i.guild) === null || _a === void 0 ? void 0 : _a.name}`);
    console.log(`Channel     : ${(_c = (_b = i.guild) === null || _b === void 0 ? void 0 : _b.channels.cache.get(i.channelId)) === null || _c === void 0 ? void 0 : _c.name}`);
    console.log(`Command     : ${i.commandName}`);
    console.log(`Options     : ${JSON.stringify(i.options.data)}`);
    console.log(`--------------------------------------------------------------------------------`);
}
exports.logCommand = logCommand;
function sendAuditLogMessage(i) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const guildSettings = yield (0, firebase_1.getGuildSettings)(i.guildId);
        if (!(guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_audit_log_channel)) {
            return;
        }
        const command = i.commandName;
        const subcommand = i.options.getSubcommand();
        const options = [];
        const user = i.user.username;
        if (subcommand) {
            i.options.data.forEach((opt) => {
                var _a;
                (_a = opt.options) === null || _a === void 0 ? void 0 : _a.forEach((opt) => {
                    var _a, _b;
                    let value = opt.value;
                    if (opt.type === 'USER') {
                        value = (_b = (_a = i.guild) === null || _a === void 0 ? void 0 : _a.members.cache.get(String(opt.value))) === null || _b === void 0 ? void 0 : _b.user.username;
                    }
                    options.push(`  ${opt.name} = ${value}`);
                });
            });
        }
        const msg = [
            `command: /${command} ${subcommand}`,
            `executed by: ${user}`,
            'parameters:',
            `${options.join('\n')}`,
        ].join('\n');
        const channel = (_a = i.guild) === null || _a === void 0 ? void 0 : _a.channels.cache.get(guildSettings === null || guildSettings === void 0 ? void 0 : guildSettings.draft_audit_log_channel);
        if (channel === null || channel === void 0 ? void 0 : channel.isText()) {
            channel.send('```' + msg + '```');
        }
    });
}
exports.sendAuditLogMessage = sendAuditLogMessage;
//# sourceMappingURL=logging.js.map