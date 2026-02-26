import type { ServerResponse } from 'node:http'

export class Response {
    private _statusCode = 200
    private _headers: Record<string, string> = {
        'content-type': 'application/json',
    }
    private _sent = false

    constructor(private readonly raw: ServerResponse) {}

    // ─── Status ──────────────────────────────────────────────────────────────

    status(code: number): this {
        this._statusCode = code
        return this
    }

    // ─── Headers ─────────────────────────────────────────────────────────────

    header(key: string, value: string): this {
        this._headers[key.toLowerCase()] = value
        return this
    }

    withHeaders(headers: Record<string, string>): this {
        for (const [key, value] of Object.entries(headers)) {
        this._headers[key.toLowerCase()] = value
        }
        return this
    }

    // ─── Sending ─────────────────────────────────────────────────────────────

    json(data: unknown, status?: number): void {
        if (status !== undefined) this._statusCode = status
        this.header('content-type', 'application/json')
        this.send(JSON.stringify(data))
    }

    text(data: string, status?: number): void {
        if (status !== undefined) this._statusCode = status
        this.header('content-type', 'text/plain; charset=utf-8')
        this.send(data)
    }

    html(data: string, status?: number): void {
        if (status !== undefined) this._statusCode = status
        this.header('content-type', 'text/html; charset=utf-8')
        this.send(data)
    }

    send(body: string | Buffer = ''): void {
        if (this._sent) throw new Error('Response already sent.')
        this._sent = true

        this.raw.writeHead(this._statusCode, this._headers)
        this.raw.end(body)
    }

    // ─── Redirects ───────────────────────────────────────────────────────────

    redirect(url: string, status = 302): void {
        this.header('location', url)
        this.status(status).send()
    }

    // ─── Common response helpers ─────────────────────────────────────────────

    ok(data: unknown): void {
        this.json(data, 200)
    }

    created(data: unknown): void {
        this.json(data, 201)
    }

    noContent(): void {
        this.status(204).send()
    }

    notFound(message = 'Not Found'): void {
        this.json({ message }, 404)
    }

    unauthorized(message = 'Unauthorized'): void {
        this.json({ message }, 401)
    }

    forbidden(message = 'Forbidden'): void {
        this.json({ message }, 403)
    }

    unprocessable(errors: Record<string, string[]>): void {
        this.json({ message: 'Unprocessable Entity', errors }, 422)
    }

    serverError(message = 'Internal Server Error'): void {
        this.json({ message }, 500)
    }

    // ─── State ───────────────────────────────────────────────────────────────

    get sent(): boolean {
        return this._sent
    }

    get nodeResponse(): ServerResponse {
        return this.raw
    }
}