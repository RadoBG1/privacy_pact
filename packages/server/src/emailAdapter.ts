import fs from 'fs'
import path from 'path'
import type { EmailAdapter } from '@privacy-pact/types'

type ConsoleEmailAdapterOptions = {
  logger?: { log: (...args: any[]) => void }
  logFilePath?: string
}

export function ConsoleEmailAdapter(opts: ConsoleEmailAdapterOptions = {}): EmailAdapter {
  const logger = opts.logger ?? console
  const logFile = opts.logFilePath ? path.resolve(opts.logFilePath) : null

  async function writeLogToFile(text: string) {
    if (!logFile) return
    try {
      await fs.promises.appendFile(logFile, text + '\n')
    } catch (e) {
      // swallow file errors for demo adapter
    }
  }

  return {
    async sendEmail(config: { to: string; subject: string; body: string; attachments?: { filename: string; content: string }[] }) {
      const { to, subject, body, attachments } = config
      logger.log('---[Privacy Pact Email]---')
      logger.log(`To: ${to}`)
      logger.log(`Subject: ${subject}`)
      logger.log('Body:')
      logger.log(body)
      if (attachments && attachments.length) {
        logger.log('Attachments:')
        for (const a of attachments) {
          logger.log(`- ${a.filename} (${a.content.length} chars)`)
        }
      }
      logger.log('---[End Email]---')

      if (logFile) {
        const lines: string[] = []
        lines.push('---[Privacy Pact Email]---')
        lines.push(`To: ${to}`)
        lines.push(`Subject: ${subject}`)
        lines.push('Body:')
        lines.push(body)
        if (attachments && attachments.length) {
          lines.push('Attachments:')
          for (const a of attachments) {
            lines.push(`- ${a.filename} (${a.content.length} chars)`)
          }
        }
        lines.push('---[End Email]---')
        await writeLogToFile(lines.join('\n'))
      }
    }
  }
}
