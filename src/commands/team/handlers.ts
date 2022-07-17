import { CommandInteraction } from 'discord.js'
import { getDraft } from '../draft/handlers'
import { checkDraftModerator } from '../helpers'

export async function handleTeamCaptain(i: CommandInteraction) {
  if (!(await checkDraftModerator(i))) {
    return
  }

  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    const team = i.options.getInteger('team', true)

    if (draft.isUserInCount(user) && !draft.isUserCaptain(user)) {
      draft.setTeamCaptain(user, team - 1)

      await i.reply({ content: `You have assigned a team captain`, ephemeral: true })
    } else {
      await i.reply({ content: `This player is not in the count`, ephemeral: true })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}

export async function handleTeamPick(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    if (!draft.isUserInCount(user)) {
      await i.reply({ content: `This player is not in the count`, ephemeral: true })
    } else if (draft.isUserOnTeam(user, 0) || draft.isUserOnTeam(user, 1)) {
      await i.reply({ content: `This player is already on a team`, ephemeral: true })
    } else if (draft.isUserCaptain(i.user)) {
      draft.addUserToCaptainsTeam(i.user, user)

      await i.reply({ content: `Player picked`, ephemeral: true })
    } else if (draft.isUserModerator(user)) {
      draft.addUserToTeam(user, (i.options.getInteger('team') ?? 1) - 1)

      await i.reply({ content: `Player assigned to team`, ephemeral: true })
    } else {
      await i.reply({
        content: `You are not a captain or draft moderator, cannot pick players`,
        ephemeral: true,
      })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}

export async function handleTeamKick(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    if (draft.isUserCaptain(i.user)) {
      draft.removeUserFromCaptainsTeam(i.user, user)

      await i.reply({ content: `Player kicked`, ephemeral: true })
    } else if (draft.isUserModerator(i.user)) {
      draft.addUserToTeam(user, (i.options.getInteger('team') ?? 1) - 1)

      await i.reply({ content: `Player assigned to team`, ephemeral: true })
    } else {
      await i.reply({ content: `You are not a captain, cannot kick players`, ephemeral: true })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}

export async function handleTeamSwap(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    if (draft.isUserModerator(i.user) || draft.isUserCaptain(i.user)) {
      draft.swapUserTeam(user)

      await i.reply({ content: `Player swapped`, ephemeral: true })
    } else {
      await i.reply({
        content: `Only draft moderators or captains can swap players`,
        ephemeral: true,
      })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}

export async function handleTeamReset(i: CommandInteraction) {
  if (!(await checkDraftModerator(i))) {
    return
  }

  const draft = getDraft(i)

  if (draft) {
    draft.teams = [[], []]

    draft.updateMessage()

    await i.reply({ content: `The teams have been reset` })
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}
