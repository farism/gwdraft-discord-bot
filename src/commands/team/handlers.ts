import { CommandInteraction } from 'discord.js'
import { getDraft } from '../draft/registry'
import { checkDraftModerator } from '../permissions'

export async function handleTeamCaptain(i: CommandInteraction) {
  if (!(await checkDraftModerator(i))) {
    return
  }

  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    const team = i.options.getInteger('team', true)

    if (!draft.isUserInCount(user)) {
      await i.reply({ content: `This player is not in the count`, ephemeral: true })
    } else if (draft.isUserACaptain(user)) {
      await i.reply({ content: `This player is already a captain`, ephemeral: true })
    } else {
      draft.setTeamCaptain(user, team)

      await i.reply({ content: `You have assigned a team captain`, ephemeral: true })
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
    } else if (draft.isUserOnATeam(user)) {
      await i.reply({ content: `This player is already on a team`, ephemeral: true })
    } else if (draft.isUserACaptain(i.user)) {
      draft.addUserToCaptainsTeam(i.user, user)

      await i.reply({ content: `Player picked`, ephemeral: true })
    } else if (draft.isUserAModerator(i.user)) {
      draft.addUserToTeam(user, i.options.getInteger('team') || 0)

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

    if (draft.isUserACaptain(i.user)) {
      draft.removeUserFromCaptainsTeam(i.user, user)

      await i.reply({ content: `Player kicked`, ephemeral: true })
    } else if (draft.isUserAModerator(i.user)) {
      draft.removeUserFromTeam(user, i.options.getInteger('team') || 0)

      await i.reply({ content: `Player removed from team`, ephemeral: true })
    } else {
      await i.reply({
        content: `You are not a captain or draft moderator, cannot kick players`,
        ephemeral: true,
      })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}

export async function handleTeamSwap(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    if (draft.isUserAModerator(i.user) || draft.isUserACaptain(i.user)) {
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
    draft.reset()
    await i.reply({ content: `The teams have been reset` })
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}
