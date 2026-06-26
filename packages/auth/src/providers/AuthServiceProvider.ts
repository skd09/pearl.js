import { ServiceProvider } from '@pearl-framework/core'
import { AuthManager } from '../AuthManager.js'
import { JwtGuard, type JwtConfig } from '../guards/JwtGuard.js'
import { SessionGuard, type SessionConfig, type SessionStore } from '../guards/SessionGuard.js'
import { ApiTokenGuard, type TokenStore } from '../guards/ApiTokenGuard.js'
import type { UserProvider, AuthUser } from '../contracts/index.js'

export interface AuthServiceConfig<TUser extends AuthUser = AuthUser> {
    defaultGuard: 'jwt' | 'session' | 'token'
    userProvider: UserProvider<TUser>
    jwt?: JwtConfig
    /** Wire the cookie/session guard. Supply a SessionStore (and optional config). */
    session?: { store: SessionStore; config?: SessionConfig }
    /** Wire the API-token guard. Supply a TokenStore. */
    token?: { store: TokenStore }
}

/**
 * AuthServiceProvider registers the AuthManager into the container.
 *
 * Usage — extend this in your app:
 *
 *   export class AppAuthServiceProvider extends AuthServiceProvider {
 *     protected config = {
 *       defaultGuard: 'jwt' as const,
 *       userProvider: new EloquentUserProvider(User),
 *       jwt: {
 *         secret: env('JWT_SECRET'),
 *         expiresIn: '7d',
 *       },
 *     }
 *   }
 */
export class AuthServiceProvider extends ServiceProvider {
    protected config!: AuthServiceConfig

    register(): void {
        this.container.singleton(AuthManager, () => {
            const manager = new AuthManager()
            const { userProvider } = this.config

            if (this.config.jwt) {
                manager.register('jwt', new JwtGuard(userProvider, this.config.jwt))
            }

            if (this.config.session) {
                manager.register(
                    'session',
                    new SessionGuard(userProvider, this.config.session.store, this.config.session.config),
                )
            }

            if (this.config.token) {
                manager.register('token', new ApiTokenGuard(userProvider, this.config.token.store))
            }

            // Set the default last, then resolve it once so a misconfigured
            // defaultGuard fails loudly at boot instead of on the first request.
            manager.setDefault(this.config.defaultGuard)
            manager.guard(this.config.defaultGuard)

            return manager
        })
    }
}