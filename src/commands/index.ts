import { banCmd } from './bans/commands'
import { configCmd } from './config/commands'
import { draftCmd } from './draft/commands'
import { preferencesCmd } from './preferences/commands'
import { rankCmd } from './rank/commands'

export const commands = [banCmd, configCmd, draftCmd, preferencesCmd, rankCmd].map((cmd) =>
  cmd.toJSON(),
)
