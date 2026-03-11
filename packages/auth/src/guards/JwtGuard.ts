import jwt from 'jsonwebtoken'
import type { SignOptions, Algorithm } from 'jsonwebtoken'
import type { AuthGuard, AuthUser, UserProvider } from '../contracts/index.js'

export interface JwtConfig {
    secret: string
    /**
     * Token expiry. Accepts zeit/ms strings ('7d', '1h', '30m') or seconds as a number.
     * Defaults to '7d'.
     */
    expiresIn?: number | string
    /**
     * Signing algorithm. Defaults to HS256.
     * SECURITY: Do NOT use 'none' — it disables signature verification entirely.
     */
    algorithm?: Algorithm
}

export interface JwtPayload {
    sub: string | number
    iat?: number
    exp?: number
}

const BLOCKED_ALGORITHMS = new Set<string>(['none'])
const DEFAULT_ALGORITHM: Algorithm = 'HS256'

export class JwtGuard<TUser extends AuthUser = AuthUser>
    implements AuthGuard<TUser>
{
    private readonly algorithm: Algorithm

    constructor(
        private readonly provider: UserProvider<TUser>,
        private readonly config: JwtConfig,
    ) {
        const algo = config.algorithm ?? DEFAULT_ALGORITHM
        if (BLOCKED_ALGORITHMS.has(algo)) {
            throw new Error(
                `JWT algorithm "${algo}" is not permitted. ` +
                `It disables signature verification and must never be used in production.`
            )
        }
        this.algorithm = algo
    }

    async attempt(identifier: string, password: string): Promise<string | null> {
        const user = await this.provider.findByCredentials(identifier, password)
        if (!user) return null
        return this.issueToken(user)
    }

    issueToken(user: TUser): string {
        const payload: JwtPayload = { sub: user.getAuthIdentifier() }

        // Resolve expiry to a concrete non-undefined value before building the options
        // object. With exactOptionalPropertyTypes:true, TypeScript treats optional
        // properties as "present with type X" | "absent" — never "present with undefined".
        // Putting a resolved value directly into the object literal satisfies that
        // constraint without needing the property to be conditionally omitted.
        const expiresIn = (this.config.expiresIn ?? '7d') as NonNullable<SignOptions['expiresIn']>

        return jwt.sign(payload, this.config.secret, {
            algorithm: this.algorithm,
            expiresIn,
        })
    }

    async check(token: string): Promise<TUser | null> {
        return this.user(token)
    }

    async user(token: string): Promise<TUser | null> {
        try {
            // Explicitly pass the expected algorithm to prevent algorithm confusion attacks.
            const payload = jwt.verify(token, this.config.secret, {
                algorithms: [this.algorithm],
            }) as JwtPayload
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

    async refresh(token: string): Promise<string | null> {
        const user = await this.user(token)
        if (!user) return null
        return this.issueToken(user)
    }
}