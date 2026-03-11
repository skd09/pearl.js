# @pearl-framework/mail

> Mailable classes and multi-transport email sending for Pearl.js.

[![npm](https://img.shields.io/npm/v/@pearl-framework/mail?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/mail)

## Installation

```bash
npm install @pearl-framework/mail @pearl-framework/core nodemailer
```

> Requires **nodemailer v7+**. Types are bundled — `@types/nodemailer` is not needed.

---

## Define a Mailable

A `Mailable` is a class that encapsulates a single email. Build it with a fluent API:

```typescript
import { Mailable } from '@pearl-framework/mail'

export class WelcomeEmail extends Mailable {
  constructor(private readonly user: User) { super() }

  build(): this {
    return this
      .sendTo(this.user.email)
      .from({ name: 'Pearl App', address: 'hi@pearl.dev' })
      .subject(`Welcome to Pearl, ${this.user.name}!`)
      .html(`
        <h1>Hi ${this.user.name}, welcome aboard!</h1>
        <p>We're thrilled to have you.</p>
        <a href="https://yourapp.com/dashboard">Get started →</a>
      `)
      .text(`Hi ${this.user.name}, welcome aboard! Visit https://yourapp.com/dashboard`)
  }
}
```

---

## Send Mail

```typescript
const mailer = app.make(Mailer)

await mailer.send(new WelcomeEmail(user))
await mailer.sendBulk([new InvoiceEmail(u1), new InvoiceEmail(u2)])
```

---

## Advanced Mailables

### Multiple recipients

```typescript
build(): this {
  return this
    .sendTo('alice@example.com', 'bob@example.com')
    .cc({ name: 'Manager', address: 'manager@example.com' })
    .bcc('audit@internal.com')
    .replyTo('support@example.com')
    .subject('Team announcement')
    .html('<p>Hello everyone!</p>')
}
```

### Attachments

```typescript
build(): this {
  return this
    .sendTo(this.user.email)
    .subject('Your invoice')
    .html('<p>Please find your invoice attached.</p>')
    .attach({
      filename:    'invoice-2024-01.pdf',
      path:        `/tmp/invoices/${this.invoiceId}.pdf`,
      contentType: 'application/pdf',
    })
}
```

### Async build

`build()` can also be `async` — useful for fetching data inside the mailable:

```typescript
async build(): Promise<this> {
  const stats = await fetchUserStats(this.user.id)
  return this
    .sendTo(this.user.email)
    .subject('Your weekly report')
    .html(renderStatsTemplate(stats))
}
```

---

## MailServiceProvider

```typescript
import { MailServiceProvider } from '@pearl-framework/mail'
import type { MailDriver } from '@pearl-framework/mail'

export class AppMailServiceProvider extends MailServiceProvider {
  protected config = {
    driver: (process.env.MAIL_DRIVER ?? 'log') as MailDriver,
    from: {
      name:    'Pearl App',
      address: process.env.MAIL_FROM!,
    },
    smtp: {
      host:   process.env.MAIL_HOST!,
      port:   Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASS!,
      },
    },
  }
}

app.register(AppMailServiceProvider)
```

---

## Transports

| Transport | Driver value | Description |
|---|---|---|
| `SmtpTransport` | `'smtp'` | Send via any SMTP provider (Mailgun, Postmark, Resend, etc.) |
| `SesTransport` | `'ses'` | Send via AWS SES (`@aws-sdk/client-ses` required) |
| `LogTransport` | `'log'` | Print email details to the console instead of sending |
| `ArrayTransport` | `'array'` | Capture sent mail in memory — for testing |

### Switching by environment

```typescript
// .env
MAIL_DRIVER=log   # development
MAIL_DRIVER=smtp  # production
```

The `LogTransport` prints full email details to the console so you can verify emails look correct during development without needing an SMTP server.

---

## Testing with `ArrayTransport`

```typescript
import { ArrayTransport, Mailer } from '@pearl-framework/mail'

const transport = new ArrayTransport()
const mailer = new Mailer(transport)

await mailer.send(new WelcomeEmail(user))

const sent = transport.last()
assert.equal(sent?.subject, `Welcome to Pearl, ${user.name}!`)
assert.equal(transport.sent.length, 1)

transport.clear()  // reset between tests
```

---

## API Reference

### `Mailable`

| Method | Description |
|---|---|
| `sendTo(...addresses)` | Set recipient(s) — accepts strings or `{ name, address }` objects |
| `from(address)` | Set the sender |
| `cc(...addresses)` | Add CC recipients |
| `bcc(...addresses)` | Add BCC recipients |
| `replyTo(address)` | Set the reply-to address |
| `subject(value)` | Set the subject line |
| `html(content)` | Set the HTML body |
| `text(content)` | Set the plain-text body |
| `attach(attachment)` | Add an attachment |
| `build()` | **Required.** Called by `mailer.send()` to build the mail — sync or async |

### `Mailer`

| Method | Description |
|---|---|
| `send(mailable)` | Build and send a single mailable |
| `sendBulk(mailables[])` | Build and send multiple mailables |

### `ArrayTransport`

| Property / Method | Description |
|---|---|
| `sent` | Array of all `BuiltMail` objects that have been sent |
| `last()` | Returns the most recently sent mail, or `undefined` |
| `clear()` | Resets the `sent` array |