import jwt from 'jsonwebtoken'
import { Hash } from '../Hash.js'
import type { AuthGuard, AuthUser, UserProvider } from '../contracts/index.js'

export interface JwtConfig {
    secret: string
    expiresIn?: string | number
    algorithm?: jwt.Algorithm
}

export interface JwtPayload {
    sub: string | number
    iat?: number
    exp?: number
}

export class JwtGuard<TUser extends AuthUser = AuthUser>
    implements AuthGuard<TUser>
{
    constructor(
        private readonly provider: UserProvider<TUser>,
        private readonly config: JwtConfig,
    ) {}

    // ─── Issue token ──────────────────────────────────────────────────────────

    async attempt(identifier: string, password: string): Promise<string | null> {
        const user = await this.provider.findByCredentials(identifier, password)
        if (!user) return null

        return this.issueToken(user)
    }

    issueToken(user: TUser): string {
        const payload: JwtPayload = { sub: user.getAuthIdentifier() }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (jwt.sign as any)(payload, this.config.secret, {
        expiresIn: (this.config.expiresIn ?? '7d') as string,
        algorithm: this.config.algorithm ?? 'HS256',
        })
    }

    // ─── Verify token ─────────────────────────────────────────────────────────

    async check(token: string): Promise<TUser | null> {
        return this.user(token)
    }

    async user(token: string): Promise<TUser | null> {
        try {
        const payload = jwt.verify(token, this.config.secret) as JwtPayload
        return this.provider.findById(payload.sub)
        } catch {
        return null
        }
    }

    decode(token: string): JwtPayload | null {
        try {
        return jwt.decode(token) as JwtPayload
        } catch {
        return null
        }
    }

    // ─── Refresh ──────────────────────────────────────────────────────────────

    async refresh(token: string): Promise<string | null> {
            const user = await this.user(token)
            if (!user) return null
            return this.issueToken(user)
    }
}