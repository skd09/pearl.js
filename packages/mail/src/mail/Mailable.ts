import type { Attachment } from 'nodemailer/lib/mailer/index.js'

export interface MailAddress {
    name?: string
    address: string
}

export interface MailEnvelope {
    from?: MailAddress | string
    to: Array<MailAddress | string>
    cc?: Array<MailAddress | string>
    bcc?: Array<MailAddress | string>
    replyTo?: MailAddress | string
    subject: string
}

export interface MailContent {
    html?: string
    text?: string
    attachments?: Attachment[]
}

export interface BuiltMail extends MailContent {
    from?: MailAddress | string
    to: Array<MailAddress | string>
    cc?: Array<MailAddress | string>
    bcc?: Array<MailAddress | string>
    replyTo?: MailAddress | string
    subject: string
}

/**
 * Base class for all Pearl mailables.
 *
 * Usage:
 *   export class WelcomeEmail extends Mailable {
 *     constructor(private readonly user: User) {
 *       super()
 *     }
 *
 *     build(): this {
 *       return this
 *         .to(this.user.email)
 *         .subject('Welcome to Pearl!')
 *         .html(`<h1>Hi ${this.user.name}!</h1>`)
 *     }
 *   }
 */
export abstract class Mailable {
    private _from?: MailAddress | string
    private _to: Array<MailAddress | string> = []
    private _cc: Array<MailAddress | string> = []
    private _bcc: Array<MailAddress | string> = []
    private _replyTo?: MailAddress | string
    private _subject = ''
    private _html?: string
    private _text?: string
    private _attachments: Attachment[] = []

    // ─── Builder methods ──────────────────────────────────────────────────────

    from(address: MailAddress | string): this {
        this._from = address
        return this
    }

    to(...addresses: Array<MailAddress | string>): this {
        this._to.push(...addresses)
        return this
    }

    cc(...addresses: Array<MailAddress | string>): this {
        this._cc.push(...addresses)
        return this
    }

    bcc(...addresses: Array<MailAddress | string>): this {
        this._bcc.push(...addresses)
        return this
    }

    replyTo(address: MailAddress | string): this {
        this._replyTo = address
        return this
    }

    subject(value: string): this {
        this._subject = value
        return this
    }

    html(content: string): this {
        this._html = content
        return this
    }

    text(content: string): this {
        this._text = content
        return this
    }

    attach(attachment: Attachment): this {
        this._attachments.push(attachment)
        return this
    }

    // ─── Build ────────────────────────────────────────────────────────────────

    /**
     * Implement this to configure the email.
     * Call this.to(), this.subject(), this.html() etc.
     */
    abstract build(): this | Promise<this>

    async compile(defaultFrom?: MailAddress | string): Promise<BuiltMail> {
        await this.build()

        const from = this._from ?? defaultFrom

        return {
            ...(from !== undefined && { from }),
            to: this._to,
            ...(this._cc.length && { cc: this._cc }),
            ...(this._bcc.length && { bcc: this._bcc }),
            ...(this._replyTo !== undefined && { replyTo: this._replyTo }),
            subject: this._subject,
            ...(this._html !== undefined && { html: this._html }),
            ...(this._text !== undefined && { text: this._text }),
            ...(this._attachments.length && { attachments: this._attachments }),
        }
    }

    // ─── Queue support ────────────────────────────────────────────────────────

    /** Override to send via queue instead of synchronously */
    shouldQueue(): boolean {
        return false
    }

    get queue(): string {
        return 'mail'
    }
}