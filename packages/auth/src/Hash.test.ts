import { describe, it, expect } from 'vitest'
import { Hash } from './Hash.js'

describe('Hash (scrypt)', () => {
    it('round-trips a password', async () => {
        const hash = await Hash.make('s3cret-pw')
        expect(hash.startsWith('scrypt$')).toBe(true)
        expect(await Hash.check('s3cret-pw', hash)).toBe(true)
    })

    it('rejects the wrong password', async () => {
        const hash = await Hash.make('correct-horse')
        expect(await Hash.check('wrong-horse', hash)).toBe(false)
    })

    it('uses a fresh salt every time', async () => {
        const a = await Hash.make('same')
        const b = await Hash.make('same')
        expect(a).not.toBe(b)
        expect(await Hash.check('same', a)).toBe(true)
        expect(await Hash.check('same', b)).toBe(true)
    })

    it('returns false for malformed hashes (no throw)', async () => {
        expect(await Hash.check('pw', 'not-a-hash')).toBe(false)
        expect(await Hash.check('pw', '')).toBe(false)
        expect(await Hash.check('pw', 'scrypt$bad')).toBe(false)
        expect(await Hash.check('pw', 'scrypt$3$8$1$$')).toBe(false)
    })

    it('needsRehash detects format and parameter drift', async () => {
        const hash = await Hash.make('pw')
        expect(Hash.needsRehash(hash)).toBe(false)
        expect(Hash.needsRehash(hash, 16)).toBe(true) // different cost
        expect(Hash.needsRehash('$2a$10$legacybcrypthashvalue')).toBe(true) // legacy bcrypt
    })
})
