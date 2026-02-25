import type { HttpContext } from '../http/HttpContext.js'
import type { Middleware } from './Pipeline.js'

export type RouteHandler = (ctx: HttpContext) => Promise<void> | void

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

export interface Route {
    method: HttpMethod
    path: string
    handler: RouteHandler
    middleware: Middleware[]
    paramKeys: string[]
    regex: RegExp
}

export interface RouteMatch {
    route: Route
    params: Record<string, string>
}

export class Router {
    private readonly routes: Route[] = []
    private globalMiddleware: Middleware[] = []

    // ─── Global middleware ───────────────────────────────────────────────────

    use(...middleware: Middleware[]): this {
        this.globalMiddleware.push(...middleware)
        return this
    }

    // ─── Route registration ──────────────────────────────────────────────────

    get(path: string, handler: RouteHandler, middleware: Middleware[] = []): this {
        return this.add('GET', path, handler, middleware)
    }

    post(path: string, handler: RouteHandler, middleware: Middleware[] = []): this {
        return this.add('POST', path, handler, middleware)
    }

    put(path: string, handler: RouteHandler, middleware: Middleware[] = []): this {
        return this.add('PUT', path, handler, middleware)
    }

    patch(path: string, handler: RouteHandler, middleware: Middleware[] = []): this {
        return this.add('PATCH', path, handler, middleware)
    }

    delete(path: string, handler: RouteHandler, middleware: Middleware[] = []): this {
        return this.add('DELETE', path, handler, middleware)
    }

    options(path: string, handler: RouteHandler, middleware: Middleware[] = []): this {
        return this.add('OPTIONS', path, handler, middleware)
    }

    // ─── Route groups ────────────────────────────────────────────────────────

    group(
        prefix: string,
        callback: (router: Router) => void,
        middleware: Middleware[] = [],
    ): this {
        const child = new Router()
        callback(child)

        for (const route of child.routes) {
        this.add(
            route.method,
            prefix + route.path,
            route.handler,
            [...middleware, ...route.middleware],
        )
        }
        return this
    }

    // ─── Route matching ──────────────────────────────────────────────────────

    match(method: string, path: string): RouteMatch | null {
        for (const route of this.routes) {
        if (route.method !== method.toUpperCase()) continue

        const match = route.regex.exec(path)
        if (!match) continue

        const params: Record<string, string> = {}
        route.paramKeys.forEach((key, i) => {
            params[key] = decodeURIComponent(match[i + 1] ?? '')
        })

        return { route, params }
        }
        return null
    }

    get allRoutes(): Route[] {
        return this.routes
    }

    get globalMiddlewares(): Middleware[] {
        return this.globalMiddleware
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    private add(
        method: HttpMethod,
        path: string,
        handler: RouteHandler,
        middleware: Middleware[],
    ): this {
        const { regex, paramKeys } = this.compilePath(path)
        this.routes.push({ method, path, handler, middleware, paramKeys, regex })
        return this
    }

    private compilePath(path: string): { regex: RegExp; paramKeys: string[] } {
        const paramKeys: string[] = []

        // Replace :param with named capture group
        const pattern = path
        .replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === ':' ? c : `\\${c}`))
        .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, key: string) => {
            paramKeys.push(key)
            return '([^/]+)'
        })
        .replace(/\\\*/g, '(.*)')

        return {
        regex: new RegExp(`^${pattern}$`),
        paramKeys,
        }
    }
}