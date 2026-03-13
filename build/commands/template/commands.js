"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesCmd = void 0;
const builders_1 = require("@discordjs/builders");
exports.templatesCmd = new builders_1.SlashCommandBuilder()
    .setName('template')
    .setDescription(`Manage templates`)
    .addSubcommand((subcommand) => subcommand
    .setName('skill')
    .setDescription('Show a skill template')
    .addStringOption((option) => option
    .setName('code')
    .setDescription('A skill template')
    .setRequired(true))
    .addBooleanOption((option) => option
    .setName('hide_skill_info')
    .setDescription('Hide the info for skills')))
    .addSubcommand((subcommand) => subcommand
    .setName('team')
    .setDescription('Show a team template')
    .addStringOption((option) => option
    .setName('1')
    .setDescription('Position 1 skill template'))
    .addStringOption((option) => option
    .setName('2')
    .setDescription('Position 2 skill template'))
    .addStringOption((option) => option
    .setName('3')
    .setDescription('Position 3 skill template'))
    .addStringOption((option) => option
    .setName('4')
    .setDescription('Position 4 skill template'))
    .addStringOption((option) => option
    .setName('5')
    .setDescription('Position 5 skill template'))
    .addStringOption((option) => option
    .setName('6')
    .setDescription('Position 6 skill template'))
    .addStringOption((option) => option
    .setName('7')
    .setDescription('Position 7 skill template'))
    .addStringOption((option) => option
    .setName('8')
    .setDescription('Position 8 skill template')));
//# sourceMappingURL=commands.js.map