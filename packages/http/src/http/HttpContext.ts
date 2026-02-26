import { Request } from './Request.js'
import { Response } from './Response.js'

/**
 * HttpContext wraps the Request and Response for a single HTTP cycle.
 * It can also carry arbitrary per-request state (e.g. authenticated user).
 */
export class HttpContext {
    private readonly _store = new Map<string, unknown>()

    constructor(
        public readonly request: Request,
        public readonly response: Response,
    ) {}

    // ─── Per-request state store ─────────────────────────────────────────────

    set<T>(key: string, value: T): void {
        this._store.set(key, value)
    }

    get<T>(key: string): T | undefined {
        return this._store.get(key) as T | undefined
    }

    has(key: string): boolean {
        return this._store.has(key)
    }

    // ─── Shortcuts ───────────────────────────────────────────────────────────

    get req(): Request {
        return this.request
    }

    get res(): Response {
        return this.response
    }
}