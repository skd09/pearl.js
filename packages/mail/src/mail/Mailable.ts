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
 *     constructor(private readonly to: string, private readonly name: string) {
 *       super()
 *     }
 *
 *     build(): this {
 *       return this
 *         .sendTo(this.to)
 *         .subject('Welcome to Pearl!')
 *         .html(`<h1>Hi ${this.name}!</h1>`)
 *     }
 *   }
 */
export abstract class Mailable {
  protected _from?: MailAddress | string
  protected _to: Array<MailAddress | string> = []
  protected _cc: Array<MailAddress | string> = []
  protected _bcc: Array<MailAddress | string> = []
  protected _replyTo?: MailAddress | string
  protected _subject = ''
  protected _html?: string
  protected _text?: string
  protected _attachments: Attachment[] = []

  // ─── Builder methods ──────────────────────────────────────────────────────

  from(address: MailAddress | string): this {
    this._from = address
    return this
  }

  /**
   * Set the recipient(s) of the email.
   * Named 'sendTo' to avoid conflicts with subclass properties named 'to'.
   */
  sendTo(...addresses: Array<MailAddress | string>): this {
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

  shouldQueue(): boolean {
    return false
  }

  get queue(): string {
    return 'mail'
  }
}