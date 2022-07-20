import { CommandInteraction } from 'discord.js'
import { getGuildSettings } from './firebase'

export function logCommand(i: CommandInteraction) {
  console.log(`--------------------------------------------------------------------------------`)
  console.log(`A command was received`)
  console.log(`--------------------------------------------------------------------------------`)
  console.log(`User        : ${i.user.username}`)
  console.log(`Guild       : ${i.guild?.name}`)
  console.log(`Channel     : ${i.guild?.channels.cache.get(i.channelId)?.name}`)
  console.log(`Command     : ${i.commandName}`)
  console.log(`Options     : ${JSON.stringify(i.options.data)}`)
  console.log(`--------------------------------------------------------------------------------`)
}

export async function sendAuditLogMessage(i: CommandInteraction) {
  const guildSettings = await getGuildSettings(i.guildId)

  if (!guildSettings?.draft_audit_log_channel) {
    return
  }

  const command = i.commandName
  const subcommand = i.options.getSubcommand()
  const options: string[] = []
  const user = i.user.username

  if (subcommand) {
    i.options.data.forEach((opt) => {
      opt.options?.forEach((opt) => {
        let value = opt.value
        if (opt.type === 'USER') {
          value = i.guild?.members.cache.get(String(opt.value))?.user.username
        }
        options.push(`  ${opt.name} = ${value}`)
      })
    })
  }

  const msg = [
    `command: /${command} ${subcommand}`,
    `executed by: ${user}`,
    'parameters:',
    `${options.join('\n')}`,
  ].join('\n')

  const channel = i.guild?.channels.cache.get(guildSettings?.draft_audit_log_channel)

  if (channel?.isText()) {
    channel.send('```' + msg + '```')
  }
}
