# @pearl-framework/mail

## 1.1.2

### Patch Changes

- [`de92297`](https://github.com/skd09/pearl.js/commit/de92297f5101deefa4511b9f33c55bcedc7a8ad8) Thanks [@skd09](https://github.com/skd09)! - fix(mail): refuse filesystem reads and URL fetches in SMTP attachments

  `SmtpTransport` now constructs nodemailer with `disableFileAccess: true` and
  `disableUrlAccess: true`. Without these flags, nodemailer follows
  `attachment.path` and `attachment.href` to read arbitrary local files or
  fetch remote URLs — a footgun if any part of an attachment is built from
  user input (file read, SSRF against internal services).

  Also bumps the `nodemailer` dependency from `^8.0.5` to `^9.0.1` to silence
  the `npm audit` warning for GHSA-p6gq-j5cr-w38f. The CVE itself was not
  exploitable via Pearl's API (Pearl never forwards the per-message `raw`
  option), but staying on a patched nodemailer line is good hygiene.

  If you genuinely need to send attachments by filesystem path or URL,
  construct your own `nodemailer` transport without these flags and wire it
  through a custom `MailTransport`.
