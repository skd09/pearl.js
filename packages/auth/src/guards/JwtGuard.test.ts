import { describe, it, expect } from 'vitest'
import { JwtGuard } from './JwtGuard.js'
import type { AuthUser, UserProvider } from '../contracts/index.js'

class TestUser implements AuthUser {
    constructor(public id: number) {}
    getAuthIdentifier(): number { return this.id }
    getAuthPassword(): string { return 'x' }
}

function provider(): UserProvider<TestUser> {
    return {
        async findById(id) { return new TestUser(Number(id)) },
        async findByCredentials(identifier) { return new TestUser(Number(identifier) || 1) },
    }
}

const secret = 'test-secret-please-change'
const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')

describe('JwtGuard (node:crypto)', () => {
    it('issues and verifies a token', async () => {
        const guard = new JwtGuard(provider(), { secret })
        const token = guard.issueToken(new TestUser(42))
        const user = await guard.user(token)
        expect(user?.getAuthIdentifier()).toBe(42)
    })

    it('rejects a tampered payload', async () => {
        const guard = new JwtGuard(provider(), { secret })
        const token = guard.issueToken(new TestUser(1))
        const [header, , signature] = token.split('.')
        const forged = b64url({ sub: 999 })
        expect(await guard.user(`${header}.${forged}.${signature}`)).toBeNull()
    })

    it('rejects a token signed with a different secret', async () => {
        const issuer = new JwtGuard(provider(), { secret })
        const verifier = new JwtGuard(provider(), { secret: 'a-different-secret' })
        const token = issuer.issueToken(new TestUser(1))
        expect(await verifier.user(token)).toBeNull()
    })

    it('rejects an expired token', async () => {
        const guard = new JwtGuard(provider(), { secret, expiresIn: -10 })
        const token = guard.issueToken(new TestUser(1))
        expect(await guard.user(token)).toBeNull()
    })

    it('rejects an alg:none token', async () => {
        const guard = new JwtGuard(provider(), { secret })
        const token = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: 1 })}.`
        expect(await guard.user(token)).toBeNull()
    })

    it('throws when constructed with a forbidden algorithm', () => {
        expect(() => new JwtGuard(provider(), { secret, algorithm: 'none' as never })).toThrow()
    })

    it('decode reads the payload without verifying', () => {
        const guard = new JwtGuard(provider(), { secret })
        const token = guard.issueToken(new TestUser(7))
        expect(guard.decode(token)?.sub).toBe(7)
    })

    it('honors a duration string for expiry', async () => {
        const guard = new JwtGuard(provider(), { secret, expiresIn: '1h' })
        const token = guard.issueToken(new TestUser(5))
        const payload = guard.decode(token)!
        expect(payload.exp! - payload.iat!).toBe(3600)
    })
})
