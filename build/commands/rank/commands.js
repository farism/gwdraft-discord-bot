"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankCmd = exports.rankChoices = exports.professionChoices = void 0;
const builders_1 = require("@discordjs/builders");
const types_1 = require("../../types");
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
exports.rankCmd = new builders_1.SlashCommandBuilder()
    .setName('rank')
    .setDescription(`Edit player ranks`)
    .addSubcommand((subcommand) => subcommand
    .setName('profession')
    .setDescription('Rank a player by specified profession')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The user to rank')
    .setRequired(true))
    .addStringOption((option) => option
    .setName('profession')
    .setDescription('The profession we are ranking')
    .setRequired(true)
    .addChoices(...exports.professionChoices))
    .addIntegerOption((option) => option
    .setName('rank')
    .setDescription('The assigned rank')
    .setRequired(true)
    .addChoices(...exports.rankChoices)))
    .addSubcommand((subcommand) => subcommand
    .setName('all')
    .setDescription('Rank a player in all categories')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The user to rank')
    .setRequired(true))
    .addIntegerOption((option) => option
    .setName('rank')
    .setDescription('The assigned rank')
    .setRequired(true)
    .addChoices(...exports.rankChoices)))
    .addSubcommand((subcommand) => subcommand
    .setName('utility')
    .setDescription('Set player utility ranks')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The user to rank')
    .setRequired(true))
    .addIntegerOption((option) => option
    .setName('split')
    .setDescription('How effective is the user at splitting')
    .setRequired(false)
    .addChoices(...exports.rankChoices))
    .addIntegerOption((option) => option
    .setName('micro')
    .setDescription('How effective is the user at micro')
    .setRequired(false)
    .addChoices(...exports.rankChoices))
    .addIntegerOption((option) => option
    .setName('macro')
    .setDescription('How effective is the user at macro')
    .setRequired(false)
    .addChoices(...exports.rankChoices)))
    .addSubcommand((subcommand) => subcommand
    .setName('reset')
    .setDescription('Reset all player ranks')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The user to rank')
    .setRequired(true)))
    .addSubcommand((subcommand) => subcommand
    .setName('view')
    .setDescription('View player ranks')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The user to rank')
    .setRequired(true)));
//# sourceMappingURL=commands.js.map