import { CommandInteraction } from 'discord.js'
import { getDraft } from '../draft/handlers'
import { interactionIsDraftModerator } from '../helpers'

export async function handleTeamCaptain(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    const team = i.options.getInteger('team', true)

    const isMod = await interactionIsDraftModerator(i)

    if (isMod) {
      if (draft.isUserInCount(user) && !draft.isUserCaptain(user)) {
        draft.setTeamCaptain(user, team - 1)

        await i.reply({ content: `You have assigned a team captain`, ephemeral: true })
      } else {
        await i.reply({ content: `This player is not in the count`, ephemeral: true })
      }
    } else {
      await i.reply({ content: `You are not the host, cannot assign captains`, ephemeral: true })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}

export async function handleTeamPick(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const user = i.options.getUser('user', true)

    if (draft.isUserCaptain(i.user)) {
      if (draft.isUserInCount(user)) {
        draft.addUserToCaptainsTeam(i.user, user)

        await i.reply({ content: `Player picked`, ephemeral: true })
      } else {
        await i.reply({ content: `This player is not in the count`, ephemeral: true })
      }
    } else {
      await i.reply({ content: `You are not a captain, cannot pick players`, ephemeral: true })
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

    const isMod = await interactionIsDraftModerator(i)

    if (isMod || draft.isUserCaptain(i.user)) {
      draft.swapUserTeam(user)

      await i.reply({ content: `Player swapped`, ephemeral: true })
    } else {
      await i.reply({ content: `Only the host or captains can swap players`, ephemeral: true })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}

export async function handleTeamReset(i: CommandInteraction) {
  const draft = getDraft(i)

  if (draft) {
    const isMod = await interactionIsDraftModerator(i)

    if (isMod) {
      draft.teams = [[], []]

      draft.updateMessage()

      await i.reply({ content: `The teams have been reset` })
    } else {
      await i.reply({ content: `Only the host can reset teams`, ephemeral: true })
    }
  } else {
    await i.reply({ content: `There is no active draft`, ephemeral: true })
  }
}
