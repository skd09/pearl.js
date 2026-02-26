export { Mailable } from './mail/Mailable.js'
export type { MailAddress, MailEnvelope, MailContent, BuiltMail } from './mail/Mailable.js'

export { Mailer } from './Mailer.js'
export type { MailerConfig } from './Mailer.js'

export { SmtpTransport, LogTransport, ArrayTransport, SesTransport } from './transports/index.js'
export type { MailTransport, SmtpConfig, SesConfig } from './transports/index.js'

export { MailServiceProvider } from './providers/MailServiceProvider.js'
export type { MailServiceConfig, MailDriver } from './providers/MailServiceProvider.js'