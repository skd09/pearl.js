import type { HttpContext, NextFn } from '@pearljs/http'
import type { AuthManager } from '../AuthManager.js'

export interface AuthMiddlewareOptions {
    guard?: string
    tokenHeader?: string
}

/**
 * Authenticate middleware — extracts Bearer token from Authorization header
 * and attaches the resolved user to the HttpContext.
 *
 * Usage:
 *   router.get('/profile', profileHandler, [Authenticate(authManager)])
 *   router.get('/admin',   adminHandler,   [Authenticate(authManager, { guard: 'jwt' })])
 *
 * Access user in controller:
 *   const user = ctx.get('auth.user')
 */
export function Authenticate(
    auth: AuthManager,
    options: AuthMiddlewareOptions = {},
) {
    return async (ctx: HttpContext, next: NextFn): Promise<void> => {
        const header = ctx.request.header(options.tokenHeader ?? 'authorization') ?? ''
        const token = header.startsWith('Bearer ') ? header.slice(7) : header

        if (!token) {
        ctx.response.unauthorized('Missing authentication token.')
        return
        }

        const user = await auth.user(token, options.guard)

        if (!user) {
        ctx.response.unauthorized('Invalid or expired token.')
        return
        }

        ctx.set('auth.user', user)
        ctx.set('auth.token', token)

        await next()
    }
}

/**
 * OptionalAuth — like Authenticate but doesn't reject unauthenticated requests.
 * The user will be null in the context if not authenticated.
 */
export function OptionalAuth(
    auth: AuthManager,
    options: AuthMiddlewareOptions = {},
) {
    return async (ctx: HttpContext, next: NextFn): Promise<void> => {
        const header = ctx.request.header(options.tokenHeader ?? 'authorization') ?? ''
        const token = header.startsWith('Bearer ') ? header.slice(7) : header

        if (token) {
        const user = await auth.user(token, options.guard)
        ctx.set('auth.user', user)
        ctx.set('auth.token', token)
        }

        await next()
    }
}