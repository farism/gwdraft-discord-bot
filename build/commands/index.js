"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const commands_1 = require("./bans/commands");
const commands_2 = require("./draft/commands");
const commands_3 = require("./settings/commands");
const commands_4 = require("./player/commands");
const commands_5 = require("./team/commands");
exports.commands = [
    commands_1.banCmd,
    commands_2.draftCmd,
    commands_4.playerCmd,
    commands_3.settingsCmd,
    commands_5.teamCmd,
].map((cmd) => cmd.toJSON());
//# sourceMappingURL=index.js.map