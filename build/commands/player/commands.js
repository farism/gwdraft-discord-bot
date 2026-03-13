"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerCmd = void 0;
const builders_1 = require("@discordjs/builders");
exports.playerCmd = new builders_1.SlashCommandBuilder()
    .setName('player')
    .setDescription(`Player management`)
    .addSubcommand((subcommand) => subcommand.setName('stats').setDescription('View your stats'))
    .addSubcommand((subcommand) => subcommand
    .setName('ign')
    .setDescription('Set in game name, helps with guesting')
    .addStringOption((option) => option
    .setName('name')
    .setDescription('Your in-game name')));
//# sourceMappingURL=commands.js.map