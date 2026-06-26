import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Password hashing built on Node's built-in `crypto.scrypt` — no third-party
 * crypto dependency, no native build step. scrypt is a memory-hard KDF
 * recommended for password storage (OWASP).
 *
 * Hash format (self-describing, so older hashes stay verifiable after the
 * defaults change):
 *
 *   scrypt$<N>$<r>$<p>$<saltBase64>$<digestBase64>
 */

const scrypt = promisify(scryptCb) as (
    password: string | Buffer,
    salt: string | Buffer,
    keylen: number,
    options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

// log2(N). Default 15 -> N = 32768 (OWASP-recommended minimum), with r=8, p=1.
const DEFAULT_COST = 15
const R = 8
const P = 1
const KEYLEN = 32
// Headroom above 128 * N * r so Node never rejects with "memory limit exceeded".
const MAXMEM = 128 * 1024 * 1024

function nFromCost(cost: number): number {
    if (!Number.isInteger(cost) || cost < 1 || cost > 20) {
        throw new Error(`Invalid scrypt cost ${cost}; expected an integer in [1, 20].`)
    }
    return 2 ** cost
}

function isPowerOfTwo(n: number): boolean {
    return Number.isInteger(n) && n > 1 && (n & (n - 1)) === 0
}

interface ParsedHash {
    N: number
    r: number
    p: number
    salt: Buffer
    digest: Buffer
}

function parse(hash: string): ParsedHash | null {
    if (typeof hash !== 'string') return null
    const parts = hash.split('$')
    if (parts.length !== 6) return null
    const [tag, nStr, rStr, pStr, saltStr, digestStr] = parts
    if (tag !== 'scrypt') return null
    if (
        nStr === undefined || rStr === undefined || pStr === undefined ||
        saltStr === undefined || digestStr === undefined
    ) return null

    const N = Number(nStr)
    const r = Number(rStr)
    const p = Number(pStr)
    if (!isPowerOfTwo(N)) return null
    if (!Number.isInteger(r) || r < 1) return null
    if (!Number.isInteger(p) || p < 1) return null

    const salt = Buffer.from(saltStr, 'base64')
    const digest = Buffer.from(digestStr, 'base64')
    if (salt.length === 0 || digest.length === 0) return null

    return { N, r, p, salt, digest }
}

export const Hash = {
    /**
     * Hash a plain-text password.
     * @param password the plain text to hash
     * @param cost log2 of the scrypt N parameter (default 15 → N = 32768)
     */
    async make(password: string, cost = DEFAULT_COST): Promise<string> {
        const N = nFromCost(cost)
        const salt = randomBytes(16)
        const digest = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM })
        return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${digest.toString('base64')}`
    },

    /**
     * Verify a plain-text password against a hash produced by `make`.
     * Constant-time comparison; returns false on any malformed input.
     */
    async check(password: string, hash: string): Promise<boolean> {
        const parsed = parse(hash)
        if (!parsed) return false

        let candidate: Buffer
        try {
            candidate = await scrypt(password, parsed.salt, parsed.digest.length, {
                N: parsed.N,
                r: parsed.r,
                p: parsed.p,
                maxmem: MAXMEM,
            })
        } catch {
            return false
        }

        if (candidate.length !== parsed.digest.length) return false
        return timingSafeEqual(candidate, parsed.digest)
    },

    /**
     * True if the hash isn't a recognised scrypt hash, or was produced with
     * different parameters than the current defaults — i.e. it should be
     * re-hashed on next successful login.
     */
    needsRehash(hash: string, cost = DEFAULT_COST): boolean {
        const parsed = parse(hash)
        if (!parsed) return true
        return parsed.N !== nFromCost(cost) || parsed.r !== R || parsed.p !== P
    },
}
