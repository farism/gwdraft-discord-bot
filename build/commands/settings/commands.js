"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsCmd = void 0;
const builders_1 = require("@discordjs/builders");
exports.settingsCmd = new builders_1.SlashCommandBuilder()
    .setName('settings')
    .setDescription(`Manage settings`)
    .addRoleOption((option) => option
    .setName('admin_role')
    .setDescription('Admin role for adjusting settings'))
    .addChannelOption((option) => option
    .setName('draft_channel')
    .setDescription('The channel where the bot will respond to /draft commands'))
    .addChannelOption((option) => option
    .setName('draft_audit_log_channel')
    .setDescription('The channel where the bot will log /draft commands for auditing purposes'))
    .addRoleOption((option) => option
    .setName('draft_moderator_role')
    .setDescription('The role required to use the /draft commands'))
    .addRoleOption((option) => option
    .setName('draft_player_role')
    .setDescription('The role to ping when forming drafts'));
//# sourceMappingURL=commands.js.map