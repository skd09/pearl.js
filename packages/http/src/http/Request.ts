import type { IncomingMessage } from 'node:http'

export interface ParsedBody {
    [key: string]: unknown
}

export class Request {
    private _body: ParsedBody = {}
    private _params: Record<string, string> = {}
    private _query: Record<string, string> = {}
    private _path: string
    private _query_string: string

    constructor(private readonly raw: IncomingMessage) {
        const rawUrl = raw.url ?? '/'
        const qIndex = rawUrl.indexOf('?')
        this._path = qIndex === -1 ? rawUrl : rawUrl.slice(0, qIndex)
        this._query_string = qIndex === -1 ? '' : rawUrl.slice(qIndex + 1)

        // Parse query string
        new URLSearchParams(this._query_string).forEach((value, key) => {
        this._query[key] = value
        })
    }

    // ─── HTTP metadata ──────────────────────────────────────────────────────

    get method(): string {
        return this.raw.method?.toUpperCase() ?? 'GET'
    }

    get path(): string {
        return this._path
    }

    get url(): string {
        return this.raw.url ?? '/'
    }

    get headers(): Record<string, string | string[] | undefined> {
        return this.raw.headers as Record<string, string | string[] | undefined>
    }

    header(name: string): string | undefined {
        const value = this.raw.headers[name.toLowerCase()]
        return Array.isArray(value) ? value[0] : value
    }

    // ─── Route params ────────────────────────────────────────────────────────

    get params(): Record<string, string> {
        return this._params
    }

    setParams(params: Record<string, string>): void {
        this._params = params
    }

    param(key: string): string | undefined {
        return this._params[key]
    }

    // ─── Query string ────────────────────────────────────────────────────────

    get query(): Record<string, string> {
        return this._query
    }

    // ─── Body ────────────────────────────────────────────────────────────────

    get body(): ParsedBody {
        return this._body
    }

    setBody(body: ParsedBody): void {
        this._body = body
    }

    input<T = unknown>(key: string, fallback?: T): T {
        const value = this._body[key] ?? this._query[key]
        return (value as T) ?? (fallback as T)
    }

    // ─── Content negotiation ─────────────────────────────────────────────────

    get contentType(): string {
        return this.header('content-type') ?? ''
    }

    isJson(): boolean {
        return this.contentType.includes('application/json')
    }

    wantsJson(): boolean {
        return (this.header('accept') ?? '').includes('application/json')
    }

    // ─── Raw node request ────────────────────────────────────────────────────

    get nodeRequest(): IncomingMessage {
        return this.raw
    }

    // ─── Static factory ──────────────────────────────────────────────────────

    static async fromIncoming(raw: IncomingMessage): Promise<Request> {
        const req = new Request(raw)
        await req.parseBody()
        return req
    }

    private async parseBody(): Promise<void> {
        if (this.method === 'GET' || this.method === 'HEAD') return

        return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        this.raw.on('data', (chunk: Buffer) => chunks.push(chunk))
        this.raw.on('error', reject)
        this.raw.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf-8')
            if (!raw) return resolve()

            if (this.isJson()) {
            try { this._body = JSON.parse(raw) as ParsedBody } catch { this._body = {} }
            } else if (this.contentType.includes('application/x-www-form-urlencoded')) {
            new URLSearchParams(raw).forEach((value, key) => { this._body[key] = value })
            }

            resolve()
        })
        })
    }
}