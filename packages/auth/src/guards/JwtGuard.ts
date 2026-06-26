import { createHmac, createSign, createVerify, createPublicKey, timingSafeEqual } from 'node:crypto'
import type { AuthGuard, AuthUser, UserProvider } from '../contracts/index.js'

/**
 * Supported JWT signing algorithms. HMAC (HS*) uses the `secret` as a shared
 * key; RSA (RS*) expects `secret` to be a PEM private key (verification derives
 * the public key from it). `none` is intentionally unsupported.
 */
export type JwtAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512'

export interface JwtConfig {
    secret: string
    /**
     * Token expiry. Accepts a number of seconds, or a duration string
     * ('60s', '30m', '1h', '7d', '2w'). Defaults to '7d'.
     */
    expiresIn?: number | string
    /** Signing algorithm. Defaults to HS256. `none` is rejected. */
    algorithm?: JwtAlgorithm
}

export interface JwtPayload {
    sub: string | number
    iat?: number
    exp?: number
    nbf?: number
    [key: string]: unknown
}

const HMAC_ALG: Record<string, string> = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' }
const RSA_ALG: Record<string, string> = { RS256: 'RSA-SHA256', RS384: 'RSA-SHA384', RS512: 'RSA-SHA512' }
const SUPPORTED = new Set<string>([...Object.keys(HMAC_ALG), ...Object.keys(RSA_ALG)])
const DEFAULT_ALGORITHM: JwtAlgorithm = 'HS256'

function base64url(input: Buffer | string): string {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

function base64urlJson(value: unknown): string {
    return base64url(JSON.stringify(value))
}

function fromBase64url(segment: string): Buffer {
    const pad = segment.length % 4 === 0 ? '' : '='.repeat(4 - (segment.length % 4))
    return Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

function durationToSeconds(value: number | string): number {
    if (typeof value === 'number') return Math.floor(value)
    const match = /^(\d+)\s*(s|m|h|d|w)?$/.exec(value.trim())
    if (!match) throw new Error(`Invalid expiresIn value: "${value}"`)
    const amount = Number(match[1])
    const unit = match[2] ?? 's'
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 }
    return amount * multipliers[unit]!
}

export class JwtGuard<TUser extends AuthUser = AuthUser> implements AuthGuard<TUser> {
    private readonly algorithm: JwtAlgorithm

    constructor(
        private readonly provider: UserProvider<TUser>,
        private readonly config: JwtConfig,
    ) {
        const algo = (config.algorithm ?? DEFAULT_ALGORITHM) as string
        if (algo === 'none' || !SUPPORTED.has(algo)) {
            throw new Error(
                `JWT algorithm "${algo}" is not supported. ` +
                `Use one of: ${[...SUPPORTED].join(', ')}. "none" is never permitted.`,
            )
        }
        this.algorithm = algo as JwtAlgorithm
    }

    async attempt(identifier: string, password: string): Promise<string | null> {
        const user = await this.provider.findByCredentials(identifier, password)
        if (!user) return null
        return this.issueToken(user)
    }

    issueToken(user: TUser): string {
        const now = Math.floor(Date.now() / 1000)
        const exp = now + durationToSeconds(this.config.expiresIn ?? '7d')
        const header = { alg: this.algorithm, typ: 'JWT' }
        const payload: JwtPayload = { sub: user.getAuthIdentifier(), iat: now, exp }
        const signingInput = `${base64urlJson(header)}.${base64urlJson(payload)}`
        return `${signingInput}.${this.signSegment(signingInput)}`
    }

    async check(token: string): Promise<TUser | null> {
        return this.user(token)
    }

    async user(token: string): Promise<TUser | null> {
        const payload = this.verifyToken(token)
        if (!payload) return null
        return this.provider.findById(payload.sub)
    }

    /** Decode the payload WITHOUT verifying the signature. Never trust this. */
    decode(token: string): JwtPayload | null {
        try {
            const segment = token.split('.')[1]
            if (!segment) return null
            return JSON.parse(fromBase64url(segment).toString('utf8')) as JwtPayload
        } catch {
            return null
        }
    }

    async refresh(token: string): Promise<string | null> {
        const user = await this.user(token)
        if (!user) return null
        return this.issueToken(user)
    }

    private signSegment(signingInput: string): string {
        if (HMAC_ALG[this.algorithm]) {
            const mac = createHmac(HMAC_ALG[this.algorithm]!, this.config.secret).update(signingInput).digest()
            return base64url(mac)
        }
        const signer = createSign(RSA_ALG[this.algorithm]!)
        signer.update(signingInput)
        signer.end()
        return base64url(signer.sign(this.config.secret))
    }

    private verifySegment(signingInput: string, signature: string): boolean {
        if (HMAC_ALG[this.algorithm]) {
            const expected = createHmac(HMAC_ALG[this.algorithm]!, this.config.secret).update(signingInput).digest()
            const provided = fromBase64url(signature)
            if (provided.length !== expected.length) return false
            return timingSafeEqual(provided, expected)
        }
        try {
            const verifier = createVerify(RSA_ALG[this.algorithm]!)
            verifier.update(signingInput)
            verifier.end()
            const publicKey = createPublicKey(this.config.secret)
            return verifier.verify(publicKey, fromBase64url(signature))
        } catch {
            return false
        }
    }

    private verifyToken(token: string): JwtPayload | null {
        if (typeof token !== 'string') return null
        const parts = token.split('.')
        if (parts.length !== 3) return null
        const [headerSeg, payloadSeg, signatureSeg] = parts

        let header: { alg?: string; typ?: string }
        try {
            header = JSON.parse(fromBase64url(headerSeg!).toString('utf8'))
        } catch {
            return null
        }
        // Enforce the configured algorithm — never trust the token's own header.
        // This defends against algorithm-confusion and `alg: none` attacks.
        if (!header || header.alg !== this.algorithm) return null

        if (!this.verifySegment(`${headerSeg}.${payloadSeg}`, signatureSeg!)) return null

        let payload: JwtPayload
        try {
            payload = JSON.parse(fromBase64url(payloadSeg!).toString('utf8'))
        } catch {
            return null
        }

        const now = Math.floor(Date.now() / 1000)
        if (typeof payload.exp === 'number' && now >= payload.exp) return null
        if (typeof payload.nbf === 'number' && now < payload.nbf) return null

        return payload
    }
}
