# @pearl-framework/mail

> Mailable classes and multi-transport email sending for Pearl.js

## Installation

```bash
pnpm add @pearl-framework/mail @pearl-framework/core nodemailer
```

## Usage

### Define a mailable

```ts
import { Mailable } from '@pearl-framework/mail'

export class WelcomeEmail extends Mailable {
  constructor(private readonly user: User) { super() }

  build(): this {
    return this
      .to(this.user.email)
      .from({ name: 'Pearl App', address: 'hi@pearl.dev' })
      .subject('Welcome to Pearl!')
      .html(`<h1>Hi ${this.user.name}, welcome aboard!</h1>`)
      .text(`Hi ${this.user.name}, welcome aboard!`)
  }
}
```

### Send mail

```ts
const mailer = app.make(Mailer)
await mailer.send(new WelcomeEmail(user))
await mailer.sendBulk([new WelcomeEmail(u1), new WelcomeEmail(u2)])
```

### MailServiceProvider

```ts
export class AppMailServiceProvider extends MailServiceProvider {
  protected config = {
    driver: process.env.MAIL_DRIVER as MailDriver,
    from: { name: 'Pearl App', address: process.env.MAIL_FROM! },
    smtp: {
      host:  process.env.MAIL_HOST!,
      port:  Number(process.env.MAIL_PORT),
      auth:  { user: process.env.MAIL_USER!, pass: process.env.MAIL_PASS! },
    },
  }
}
```

### Transports

| Transport | Use case |
|-----------|---------|
| `SmtpTransport` | Production SMTP (Mailgun, Postmark, etc.) |
| `SesTransport` | AWS SES |
| `LogTransport` | Development — logs to console |
| `ArrayTransport` | Testing — captures emails in memory |

---