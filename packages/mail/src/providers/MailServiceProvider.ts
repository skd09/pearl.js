import { ServiceProvider } from '@pearljs/core'
import { Mailer } from '../Mailer.js'
import {
    SmtpTransport,
    LogTransport,
    ArrayTransport,
    type MailTransport,
    type SmtpConfig,
} from '../transports/index.js'
import type { MailAddress } from '../mail/Mailable.js'

export type MailDriver = 'smtp' | 'log' | 'array'

export interface MailServiceConfig {
    driver: MailDriver
    from?: MailAddress | string
    smtp?: SmtpConfig
}

/**
 * MailServiceProvider registers the Mailer into the container.
 *
 * Usage — extend this in your app:
 *
 *   export class AppMailServiceProvider extends MailServiceProvider {
 *     protected config: MailServiceConfig = {
 *       driver: env('MAIL_DRIVER') as MailDriver,
 *       from: { name: 'Pearl App', address: env('MAIL_FROM') },
 *       smtp: {
 *         host: env('MAIL_HOST'),
 *         port: env.number('MAIL_PORT'),
 *         auth: { user: env('MAIL_USER'), pass: env('MAIL_PASS') },
 *       },
 *     }
 *   }
 */
export class MailServiceProvider extends ServiceProvider {
    protected config: MailServiceConfig = {
        driver: 'log',
    }

    register(): void {
        this.container.singleton(Mailer, () => {
        const transport = this.resolveTransport()
        return new Mailer({
            transport,
            ...(this.config.from !== undefined && { from: this.config.from }),
        })
        })
    }

    private resolveTransport(): MailTransport {
        switch (this.config.driver) {
        case 'smtp': {
            if (!this.config.smtp) {
            throw new Error('SMTP config is required when using the smtp mail driver.')
            }
            return new SmtpTransport(this.config.smtp)
        }
        case 'array':
            return new ArrayTransport()
        case 'log':
        default:
            return new LogTransport()
        }
    }
}