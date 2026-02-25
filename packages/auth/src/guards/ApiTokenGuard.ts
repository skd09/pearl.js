import { randomBytes } from 'node:crypto'
import type { AuthGuard, AuthUser, UserProvider } from '../contracts/index.js'

export interface TokenRecord {
    token: string
    userId: number | string
    expiresAt?: Date
}

export interface TokenStore {
    find(token: string): Promise<TokenRecord | null>
    save(record: TokenRecord): Promise<void>
    revoke(token: string): Promise<void>
    revokeAll(userId: number | string): Promise<void>
}

export class ApiTokenGuard<TUser extends AuthUser = AuthUser>
    implements AuthGuard<TUser>
{
    constructor(
        private readonly provider: UserProvider<TUser>,
        private readonly store: TokenStore,
    ) {}

    // ─── Issue token ──────────────────────────────────────────────────────────

    async attempt(identifier: string, password: string): Promise<string | null> {
        const user = await this.provider.findByCredentials(identifier, password)
        if (!user) return null

        return this.issueToken(user)
    }

    async issueToken(user: TUser, expiresAt?: Date): Promise<string> {
        const token = randomBytes(40).toString('hex')

        await this.store.save({
        token,
        userId: user.getAuthIdentifier(),
        ...(expiresAt !== undefined && { expiresAt }),
        })

        return token
    }

    // ─── Verify token ─────────────────────────────────────────────────────────

    async check(token: string): Promise<TUser | null> {
        return this.user(token)
    }

    async user(token: string): Promise<TUser | null> {
        const record = await this.store.find(token)
        if (!record) return null

        if (record.expiresAt !== undefined && record.expiresAt < new Date()) {
        await this.store.revoke(token)
        return null
        }

        return this.provider.findById(record.userId)
    }

    // ─── Revocation ───────────────────────────────────────────────────────────

    async revoke(token: string): Promise<void> {
        await this.store.revoke(token)
    }

    async revokeAll(user: TUser): Promise<void> {
        await this.store.revokeAll(user.getAuthIdentifier())
    }
}