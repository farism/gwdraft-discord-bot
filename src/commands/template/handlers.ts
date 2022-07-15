import { CommandInteraction, MessageAttachment } from 'discord.js'
import { decodeTemplate, skillbarToImage } from '../../skills'

export async function handleSkillTemplate(i: CommandInteraction) {
  const code = i.options.getString('code', true)

  const skillbar = decodeTemplate(code)

  if (skillbar) {
    const canvas = await skillbarToImage(skillbar)

    const img = new MessageAttachment(canvas.toBuffer(), `${code}.png`)

    await i.reply({ content: `Skill template`, files: [img] })
  }
}
