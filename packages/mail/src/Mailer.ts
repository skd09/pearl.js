import type { MailTransport } from './transports/index.js'
import type { Mailable, MailAddress } from './mail/Mailable.js'

export interface MailerConfig {
    from?: MailAddress | string
    transport: MailTransport
}

export class Mailer {
    constructor(private readonly config: MailerConfig) {}

    // ─── Sending ──────────────────────────────────────────────────────────────

    async send(mailable: Mailable): Promise<void> {
        const mail = await mailable.compile(this.config.from)
        await this.config.transport.send(mail)
    }

    async sendBulk(mailables: Mailable[]): Promise<void> {
        await Promise.all(mailables.map((m) => this.send(m)))
    }

    // ─── Transport access ─────────────────────────────────────────────────────

    get transport(): MailTransport {
        return this.config.transport
    }
}