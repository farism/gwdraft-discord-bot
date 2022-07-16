import { SlashCommandBuilder } from '@discordjs/builders'

export const settingsCmd = new SlashCommandBuilder()
  .setName('settings')
  .setDescription(`Manage settings`)
  .addChannelOption((option) =>
    // prettier-ignore
    option
      .setName('draft_channel')
      .setDescription('The channel where the bot will respond to /draft commands'),
  )
  .addChannelOption((option) =>
    // prettier-ignore
    option
      .setName('draft_audit_log_channel')
      .setDescription('The channel where the bot will log /draft commands for auditing purposes'),
  )
  .addRoleOption((option) =>
    // prettier-ignore
    option
      .setName('draft_moderator_role')
      .setDescription('The role required to use the /draft commands'),
  )
  .addRoleOption((option) =>
    // prettier-ignore
    option
      .setName('draft_player_role')
      .setDescription('The role to ping when forming drafts'),
  )
