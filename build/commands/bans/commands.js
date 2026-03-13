"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.banCmd = void 0;
const builders_1 = require("@discordjs/builders");
exports.banCmd = new builders_1.SlashCommandBuilder()
    .setName('c')
    .setDescription(`Manage bans`)
    .addSubcommand((subcommand) => subcommand
    .setName('ban')
    .setDescription('Ban or unban a player')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The player to ban or unban'))
    .addStringOption((option) => option
    .setName('reason')
    .setDescription('The reason the player is banned')))
    .addSubcommand((subcommand) => subcommand.setName('unba').setDescription('Ban a player'));
//# sourceMappingURL=commands.js.map