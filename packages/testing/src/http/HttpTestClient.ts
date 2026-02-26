import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { TestResponse, type RawResponse } from './TestResponse.js'

type AppHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

export interface RequestOptions {
    headers?: Record<string, string>
    body?: unknown
}

/**
 * HttpTestClient makes in-process HTTP requests without binding a port.
 * Works with any Node.js http handler — including Pearl's HttpKernel.
 *
 * Usage:
 *   const client = new HttpTestClient(app.kernel.handler)
 *   const res = await client.get('/users')
 *   res.assertOk().assertJson()
 */
export class HttpTestClient {
    private defaultHeaders: Record<string, string> = {
        'content-type': 'application/json',
        'accept': 'application/json',
    }

    constructor(private readonly handler: AppHandler) {}

    // ─── Auth helpers ─────────────────────────────────────────────────────────

    withToken(token: string): this {
        this.defaultHeaders['authorization'] = `Bearer ${token}`
        return this
    }

    withHeaders(headers: Record<string, string>): this {
        Object.assign(this.defaultHeaders, headers)
        return this
    }

    withoutToken(): this {
        delete this.defaultHeaders['authorization']
        return this
    }

    // ─── HTTP methods ─────────────────────────────────────────────────────────

    get(url: string, options?: RequestOptions): Promise<TestResponse> {
        return this.request('GET', url, options)
    }

    post(url: string, body?: unknown, options?: RequestOptions): Promise<TestResponse> {
        return this.request('POST', url, { ...options, body })
    }

    put(url: string, body?: unknown, options?: RequestOptions): Promise<TestResponse> {
        return this.request('PUT', url, { ...options, body })
    }

    patch(url: string, body?: unknown, options?: RequestOptions): Promise<TestResponse> {
        return this.request('PATCH', url, { ...options, body })
    }

    delete(url: string, options?: RequestOptions): Promise<TestResponse> {
        return this.request('DELETE', url, options)
    }

    // ─── Core ─────────────────────────────────────────────────────────────────

    private async request(
        method: string,
        url: string,
        options: RequestOptions = {},
    ): Promise<TestResponse> {
        const bodyString = options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined

        const headers: Record<string, string> = {
            ...this.defaultHeaders,
            ...options.headers,
        }

        if (bodyString !== undefined) {
            headers['content-length'] = Buffer.byteLength(bodyString).toString()
        }

        return new Promise((resolve, reject) => {
            const req = Object.assign(
                new (require('events').EventEmitter)(),
                {
                    method,
                    url,
                    headers,
                    socket: { remoteAddress: '127.0.0.1' },
                },
            ) as unknown as IncomingMessage

            const responseChunks: Buffer[] = []
            const responseHeaders: Record<string, string | string[]> = {}
            let statusCode = 200

            const res = {
                statusCode,
                setHeader(key: string, value: string | string[]) {
                    responseHeaders[key.toLowerCase()] = value
                },
                writeHead(code: number, hdrs?: Record<string, string>) {
                    statusCode = code
                    if (hdrs) Object.assign(responseHeaders, hdrs)
                },
                end(body?: string | Buffer) {
                    if (body) responseChunks.push(Buffer.isBuffer(body) ? body : Buffer.from(body))
                    const raw: RawResponse = {
                        statusCode,
                        headers: responseHeaders,
                        body: Buffer.concat(responseChunks).toString('utf-8'),
                    }
                    resolve(new TestResponse(raw))
                },
                write(chunk: string | Buffer) {
                    responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
                },
            } as unknown as ServerResponse

            Promise.resolve(this.handler(req, res)).catch(reject)

            // Emit body
            if (bodyString !== undefined) {
                process.nextTick(() => {
                req.emit('data', Buffer.from(bodyString))
                req.emit('end')
                })
            } else {
                process.nextTick(() => req.emit('end'))
            }
        })
    }
}