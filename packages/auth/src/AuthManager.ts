import type { AuthGuard, AuthUser } from './contracts/index.js'

export class AuthManager {
    private readonly guards = new Map<string, AuthGuard>()
    private defaultGuard = 'jwt'

    // ─── Guard registration ───────────────────────────────────────────────────

    register(name: string, guard: AuthGuard): this {
        this.guards.set(name, guard)
        return this
    }

    setDefault(name: string): this {
        this.defaultGuard = name
        return this
    }

    // ─── Guard access ─────────────────────────────────────────────────────────

    guard(name?: string): AuthGuard {
        const guardName = name ?? this.defaultGuard
        const guard = this.guards.get(guardName)

        if (!guard) {
        throw new Error(
            `Auth guard "${guardName}" is not registered. ` +
            `Did you forget to call AuthManager.register("${guardName}", guard)?`
        )
        }

        return guard
    }

    // ─── Shorthand helpers ────────────────────────────────────────────────────

    async attempt(identifier: string, password: string, guardName?: string): Promise<string | null> {
        return this.guard(guardName).attempt(identifier, password)
    }

    async check(token: string, guardName?: string): Promise<AuthUser | null> {
        return this.guard(guardName).check(token)
    }

    async user(token: string, guardName?: string): Promise<AuthUser | null> {
        return this.guard(guardName).user(token)
    }
}