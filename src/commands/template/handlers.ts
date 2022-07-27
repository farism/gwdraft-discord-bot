import { CommandInteraction, MessageAttachment, MessageEmbed } from 'discord.js'
import { decodeTemplate, getAttributeName, getProfessionName, skillbarToImage } from '../../skills'

export async function handleSkillTemplate(i: CommandInteraction) {
  const code = i.options.getString('code', true)

  const hideSkillInfo = i.options.getBoolean('hide_skill_info') || false

  const skillbar = decodeTemplate(code)

  if (skillbar) {
    const canvas = await skillbarToImage(skillbar)

    const attachment = new MessageAttachment(canvas.toBuffer(), `image.png`)

    const attributes = Object.entries(skillbar.attributes).map(
      ([key, value]) => `${getAttributeName(key as any)}: **${value}**`,
    )

    const primary = getProfessionName(skillbar.primary)

    const secondary = getProfessionName(skillbar.secondary)

    const embed = new MessageEmbed()
      .setTitle(`${primary} / ${secondary} - ${code}`)
      .setDescription(attributes.join(', '))

    if (!hideSkillInfo) {
      skillbar.skills.forEach((skill: any, i) => {
        const details: string[] = []

        if (skill?.adrenaline) {
          details.push(`<:skilladrenaline:997661520915877958> ${skill?.adrenaline}`)
        }
        if (skill?.energy) {
          details.push(`<:skillenergy:997661522727804929> ${skill?.energy}`)
        }

        if (skill?.activation) {
          details.push(`<:skillactivationtime:997661517866598440> ${skill?.activation}`)
        }

        if (skill?.recharge) {
          details.push(`<:skillrechargetime:997661525928063046> ${skill?.recharge}`)
        }

        if (i > 0 && (i - 1) % 2 === 0) {
          embed.addField('\u200b', '\u200b', true)
        }

        const concise = skill?.['concise description']

        const page = encodeURIComponent(skill?.name)

        const link = `[(info)](https://wiki.guildwars.com/wiki/${page} "${concise}")`

        embed.addField(`${i + 1}. ${skill?.name}`, `${details.join('  ')} - ${link}`, true)
      })
    }

    await i.reply({ files: [attachment], embeds: [embed] })
  }
}

export async function handleTeamTemplate(i: CommandInteraction) {
  const files: MessageAttachment[] = []

  for (let j = 1; j <= 8; j++) {
    const code = i.options.getString(String(j))

    if (code) {
      const skillbar = decodeTemplate(code)

      if (skillbar) {
        const canvas = await skillbarToImage(skillbar)
        const attachment = new MessageAttachment(canvas.toBuffer(), `player${i}.png`)
        files.push(attachment)
      }
    }
  }

  await i.reply({ content: 'Team build', files })
}
