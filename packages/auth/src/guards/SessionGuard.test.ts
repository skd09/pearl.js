import { describe, it, expect } from 'vitest'
import { SessionGuard, type SessionRecord, type SessionStore } from './SessionGuard.js'
import type { AuthUser, UserProvider } from '../contracts/index.js'

class FakeUser implements AuthUser {
    constructor(public id: number, public passwordHash = 'hash') {}
    getAuthIdentifier(): number { return this.id }
    getAuthPassword(): string { return this.passwordHash }
}

class FakeProvider implements UserProvider<FakeUser> {
    constructor(private readonly user: FakeUser) {}
    async findById(id: number | string) { return this.user.id === id ? this.user : null }
    async findByCredentials(_id: string, _pw: string) { return this.user }
}

class MemorySessionStore implements SessionStore {
    public sessions = new Map<string, SessionRecord>()
    async find(id: string) { return this.sessions.get(id) ?? null }
    async save(r: SessionRecord) { this.sessions.set(r.id, r) }
    async destroy(id: string) { this.sessions.delete(id) }
    async destroyAll(userId: number | string) {
        for (const [k, v] of this.sessions) if (v.userId === userId) this.sessions.delete(k)
    }
}

describe('SessionGuard', () => {
    it('issues a session on successful attempt', async () => {
        const user = new FakeUser(1)
        const store = new MemorySessionStore()
        const guard = new SessionGuard(new FakeProvider(user), store)

        const id = await guard.attempt('a@b.com', 'pw')
        expect(id).toBeTruthy()
        expect(store.sessions.size).toBe(1)
    })

    it('resolves the user from a valid session id', async () => {
        const user = new FakeUser(1)
        const store = new MemorySessionStore()
        const guard = new SessionGuard(new FakeProvider(user), store)
        const id = (await guard.attempt('a', 'b'))!

        const found = await guard.user(id)
        expect(found?.id).toBe(1)
    })

    it('rejects an expired session and destroys it', async () => {
        const user = new FakeUser(1)
        const store = new MemorySessionStore()
        const guard = new SessionGuard(new FakeProvider(user), store)
        const id = (await guard.attempt('a', 'b'))!
        const rec = store.sessions.get(id)!
        rec.expiresAt = new Date(Date.now() - 1000)

        expect(await guard.user(id)).toBeNull()
        expect(store.sessions.size).toBe(0)
    })

    it('rotates session id when configured and hands back the new id', async () => {
        const user = new FakeUser(1)
        const store = new MemorySessionStore()
        let rotatedTo: string | null = null
        const guard = new SessionGuard(new FakeProvider(user), store, {
            rotateOnUse: true,
            onRotate: (newId) => { rotatedTo = newId },
        })
        const id = (await guard.attempt('a', 'b'))!

        const found = await guard.user(id)
        expect(found?.id).toBe(1)

        // Old id is gone, exactly one session remains, and the caller received
        // the replacement id (the bug: it used to be discarded).
        expect(store.sessions.has(id)).toBe(false)
        expect(store.sessions.size).toBe(1)
        expect(rotatedTo).toBeTruthy()
        expect(rotatedTo).not.toBe(id)
        expect(store.sessions.has(rotatedTo!)).toBe(true)
    })

    it('logoutAll destroys every session for the user', async () => {
        const user = new FakeUser(1)
        const store = new MemorySessionStore()
        const guard = new SessionGuard(new FakeProvider(user), store)
        await guard.attempt('a', 'b')
        await guard.attempt('a', 'b')
        await guard.attempt('a', 'b')
        expect(store.sessions.size).toBe(3)

        await guard.logoutAll(user)
        expect(store.sessions.size).toBe(0)
    })

    it('returns null for an empty token', async () => {
        const guard = new SessionGuard(new FakeProvider(new FakeUser(1)), new MemorySessionStore())
        expect(await guard.user('')).toBeNull()
    })
})
