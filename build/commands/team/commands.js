"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamCmd = void 0;
const builders_1 = require("@discordjs/builders");
exports.teamCmd = new builders_1.SlashCommandBuilder()
    .setName('team')
    .setDescription(`Manage teams`)
    .addSubcommand((subcommand) => subcommand
    .setName('captain')
    .setDescription('Select a captain for a team')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The player to captain')
    .setRequired(true))
    .addIntegerOption((option) => option
    .setName('team')
    .setDescription('The team to captain')
    .setChoices({ name: '1', value: 1 }, { name: '2', value: 2 })
    .setRequired(true)))
    .addSubcommand((subcommand) => subcommand
    .setName('pick')
    .setDescription('Add a player to your team')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The player to pick')
    .setRequired(true))
    .addIntegerOption((option) => option
    .setName('team')
    .setDescription('The team to assign the player to (optional for captains)')
    .setChoices({ name: '1', value: 1 }, { name: '2', value: 2 })))
    .addSubcommand((subcommand) => subcommand
    .setName('kick')
    .setDescription('Remove a player from your team')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The player to kick')
    .setRequired(true))
    .addIntegerOption((option) => option
    .setName('team')
    .setDescription('The team to to remove the player from (optional for captains)')
    .setChoices({ name: '1', value: 1 }, { name: '2', value: 2 })))
    .addSubcommand((subcommand) => subcommand
    .setName('swap')
    .setDescription('Swap a player to the other team')
    .addUserOption((option) => option
    .setName('user')
    .setDescription('The player to swap')
    .setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('reset').setDescription('Resets/clears out the teams'));
//# sourceMappingURL=commands.js.map