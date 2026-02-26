import * as assert from 'node:assert'

export interface RawResponse {
    statusCode: number
    headers: Record<string, string | string[]>
    body: string
}

export class TestResponse {
    private _json?: unknown

    constructor(private readonly raw: RawResponse) {}

    assertStatus(expected: number): this {
        assert.strictEqual(this.raw.statusCode, expected,
        `Expected status ${expected} but got ${this.raw.statusCode}.\nBody: ${this.raw.body}`)
        return this
    }

    assertOk(): this { return this.assertStatus(200) }
    assertCreated(): this { return this.assertStatus(201) }
    assertNoContent(): this { return this.assertStatus(204) }
    assertNotFound(): this { return this.assertStatus(404) }
    assertUnauthorized(): this { return this.assertStatus(401) }
    assertForbidden(): this { return this.assertStatus(403) }
    assertUnprocessable(): this { return this.assertStatus(422) }
    assertServerError(): this { return this.assertStatus(500) }

    assertRedirect(url?: string): this {
        assert.ok([301, 302, 303, 307, 308].includes(this.raw.statusCode),
        `Expected a redirect but got ${this.raw.statusCode}.`)
        if (url !== undefined) {
            const location = this.header('location')
            assert.strictEqual(location, url, `Expected redirect to "${url}" but got "${location}".`)
        }
        return this
    }

    assertHeader(key: string, value?: string): this {
        const actual = this.header(key)
        assert.ok(actual !== undefined, `Expected header "${key}" to be present.`)
        if (value !== undefined) {
            assert.strictEqual(actual, value)
        }
        return this
    }

    assertJson(expected?: Record<string, unknown>): this {
        const contentType = this.header('content-type') ?? ''
        assert.ok(contentType.includes('application/json'),
        `Expected JSON response but content-type was "${contentType}".`)
        if (expected !== undefined) {
            const body = this.json() as Record<string, unknown>
            for (const [key, value] of Object.entries(expected)) {
                assert.deepStrictEqual(body[key], value,
                `Expected JSON key "${key}" to equal ${JSON.stringify(value)} but got ${JSON.stringify(body[key])}.`)
            }
        }
        return this
    }

    assertJsonPath(path: string, expected: unknown): this {
        const body = this.json() as Record<string, unknown>
        const parts = path.split('.')
        let current: unknown = body
        for (const part of parts) {
        if (current === null || typeof current !== 'object') assert.fail(`Path "${path}" not found.`)
            current = (current as Record<string, unknown>)[part]
        }
        assert.deepStrictEqual(current, expected)
        return this
    }

    assertJsonCount(key: string, count: number): this {
        const body = this.json() as Record<string, unknown>
        const value = body[key]
        assert.ok(Array.isArray(value), `Expected "${key}" to be an array.`)
        assert.strictEqual(value.length, count)
        return this
    }

    assertBodyContains(text: string): this {
        assert.ok(this.raw.body.includes(text), `Expected body to contain "${text}".`)
        return this
    }

    assertValidationErrors(fields: string[]): this {
        this.assertUnprocessable()
        const body = this.json() as { errors?: Record<string, unknown> }
        assert.ok(body.errors, 'Expected validation errors in response body.')
        for (const field of fields) {
            assert.ok(field in body.errors, `Expected validation error for field "${field}".`)
        }
        return this
    }

    json<T = unknown>(): T {
        if (this._json === undefined) this._json = JSON.parse(this.raw.body) as T
        return this._json as T
    }

    header(key: string): string | undefined {
        const value = this.raw.headers[key.toLowerCase()]
        return Array.isArray(value) ? value[0] : value
    }

    get status(): number { return this.raw.statusCode }
    get body(): string { return this.raw.body }
}