import { ServiceProvider } from '@pearljs/core'
import { AuthManager } from '../AuthManager.js'
import { JwtGuard, type JwtConfig } from '../guards/JwtGuard.js'
import type { UserProvider, AuthUser } from '../contracts/index.js'

export interface AuthServiceConfig<TUser extends AuthUser = AuthUser> {
    defaultGuard: 'jwt' | 'token'
    userProvider: UserProvider<TUser>
    jwt?: JwtConfig
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
            manager.setDefault(this.config.defaultGuard)

            if (this.config.jwt) {
                manager.register(
                    'jwt',
                    new JwtGuard(this.config.userProvider, this.config.jwt),
                )
            }

            return manager
        })
    }
}