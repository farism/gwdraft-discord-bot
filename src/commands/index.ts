import { banCmd } from './bans/commands'
import { draftCmd } from './draft/commands'
import { preferencesCmd } from './preferences/commands'
import { rankCmd } from './rank/commands'
import { settingsCmd } from './settings/commands'
import { playerCmd } from './player/commands'
import { teamCmd } from './team/commands'
import { templatesCmd } from './template/commands'

export const commands = [
  // banCmd,
  draftCmd,
  playerCmd,
  // preferencesCmd,
  // rankCmd,
  settingsCmd,
  teamCmd,
  templatesCmd,
].map((cmd) => cmd.toJSON())
