import type { BuiltMail, MailAddress } from '../mail/Mailable.js'

export interface MailTransport {
    send(mail: BuiltMail): Promise<void>
}

function toNodemailerAddress(addr: MailAddress | string): string {
    if (typeof addr === 'string') return addr
    return addr.name ? `"${addr.name}" <${addr.address}>` : addr.address
}

export interface SmtpConfig {
    host: string
    port: number
    secure?: boolean
    auth?: { user: string; pass: string }
}

export class SmtpTransport implements MailTransport {
    constructor(private readonly config: SmtpConfig) {}

    async send(mail: BuiltMail): Promise<void> {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure ?? this.config.port === 465,
            ...(this.config.auth !== undefined && { auth: this.config.auth }),
        })

        await transporter.sendMail({
            ...(mail.from !== undefined && { from: toNodemailerAddress(mail.from) }),
            to: mail.to.map(toNodemailerAddress).join(', '),
            ...(mail.cc !== undefined && { cc: mail.cc.map(toNodemailerAddress).join(', ') }),
            ...(mail.bcc !== undefined && { bcc: mail.bcc.map(toNodemailerAddress).join(', ') }),
            ...(mail.replyTo !== undefined && { replyTo: toNodemailerAddress(mail.replyTo) }),
            subject: mail.subject,
            ...(mail.html !== undefined && { html: mail.html }),
            ...(mail.text !== undefined && { text: mail.text }),
            ...(mail.attachments !== undefined && { attachments: mail.attachments }),
        })
    }
}

export interface SesConfig {
    region: string
    accessKeyId: string
    secretAccessKey: string
}

export class SesTransport implements MailTransport {
    constructor(private readonly config: SesConfig) {}

    async send(mail: BuiltMail): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aws = await import('@aws-sdk/client-ses' as string) as any
        const client = new aws.SESClient({
        region: this.config.region,
        credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
        },
        })
        const toAddresses = mail.to.map((a) => typeof a === 'string' ? a : a.address)
        await client.send(new aws.SendEmailCommand({
        Source: mail.from ? toNodemailerAddress(mail.from) : '',
        Destination: { ToAddresses: toAddresses },
        Message: {
            Subject: { Data: mail.subject },
            Body: {
            ...(mail.html !== undefined && { Html: { Data: mail.html } }),
            ...(mail.text !== undefined && { Text: { Data: mail.text } }),
            },
        },
        }))
    }
}

export class LogTransport implements MailTransport {
    async send(mail: BuiltMail): Promise<void> {
        console.log('\n📧 [Pearl Mail — LogTransport]')
        console.log('  From:   ', mail.from)
        console.log('  To:     ', mail.to)
        console.log('  Subject:', mail.subject)
        if (mail.html) console.log('  HTML:   ', mail.html.slice(0, 100) + '...')
        if (mail.text) console.log('  Text:   ', mail.text.slice(0, 100) + '...')
        console.log('')
    }
}

    export class ArrayTransport implements MailTransport {
    readonly sent: BuiltMail[] = []
    async send(mail: BuiltMail): Promise<void> { this.sent.push(mail) }
    clear(): void { this.sent.length = 0 }
    last(): BuiltMail | undefined { return this.sent[this.sent.length - 1] }
}