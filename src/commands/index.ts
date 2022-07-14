import { banCmd } from './ban'
import { draftCmd } from './draft'
import { preferencesCmd } from './preferences'
import { rankCmd } from './rank'

export const commands = [banCmd, draftCmd, preferencesCmd, rankCmd].map((cmd) => cmd.toJSON())
