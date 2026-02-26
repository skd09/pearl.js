import * as assert from 'node:assert'

export interface CapturedMail {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    from?: string
    [key: string]: unknown
}

/**
 * MailFake captures sent emails instead of delivering them.
 * Use in tests to assert emails were sent correctly.
 *
 * Usage:
 *   const mail = new MailFake()
 *   // inject into container...
 *
 *   await someAction()
 *
 *   mail.assertSent(WelcomeEmail)
 *   mail.assertSentTo('user@example.com')
 *   mail.assertCount(1)
 */
export class MailFake {
    private readonly _sent: CapturedMail[] = []

    async send(mail: CapturedMail): Promise<void> {
        this._sent.push(mail)
    }

    // ─── Assertions ───────────────────────────────────────────────────────────

    assertSent(subjectOrMatcher: string | ((mail: CapturedMail) => boolean)): this {
        const found = typeof subjectOrMatcher === 'string'
        ? this._sent.some((m) => m.subject === subjectOrMatcher)
        : this._sent.some(subjectOrMatcher)

        assert.ok(found, `Expected mail to be sent but none matched.`)
        return this
    }

    assertNotSent(subjectOrMatcher: string | ((mail: CapturedMail) => boolean)): this {
        const found = typeof subjectOrMatcher === 'string'
        ? this._sent.some((m) => m.subject === subjectOrMatcher)
        : this._sent.some(subjectOrMatcher)

        assert.ok(!found, `Expected mail NOT to be sent but one matched.`)
        return this
    }

    assertSentTo(address: string): this {
        const found = this._sent.some((m) => {
            const to = Array.isArray(m.to) ? m.to : [m.to]
            return to.includes(address)
        })
        assert.ok(found, `Expected mail to be sent to "${address}".`)
        return this
    }

    assertCount(expected: number): this {
        assert.strictEqual(
            this._sent.length,
            expected,
            `Expected ${expected} mail(s) to be sent but got ${this._sent.length}.`,
        )
        return this
    }

    assertNothingSent(): this {
        return this.assertCount(0)
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    get sent(): CapturedMail[] { return this._sent }
    last(): CapturedMail | undefined { return this._sent[this._sent.length - 1] }
    reset(): void { this._sent.length = 0 }
}