import { createServer, type Server } from 'node:http'
import { Request } from './http/Request.js'
import { Response } from './http/Response.js'
import { HttpContext } from './http/HttpContext.js'
import { Pipeline } from './routing/Pipeline.js'
import { Router } from './routing/Router.js'

export interface KernelOptions {
    port?: number
    host?: string
}

export class HttpKernel {
    private readonly server: Server
    private router: Router = new Router()

    constructor() {
        this.server = createServer(async (rawReq, rawRes) => {
        await this.handleRequest(rawReq, rawRes)
        })
    }

    // ─── Router ──────────────────────────────────────────────────────────────

    useRouter(router: Router): this {
        this.router = router
        return this
    }

    // ─── Server lifecycle ────────────────────────────────────────────────────

    listen(port = 3000, host = 'localhost', callback?: () => void): this {
        this.server.listen(port, host, callback)
        return this
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
        this.server.close((err) => (err ? reject(err) : resolve()))
        })
    }

    // ─── Request handling ────────────────────────────────────────────────────

    private async handleRequest(
        rawReq: import('node:http').IncomingMessage,
        rawRes: import('node:http').ServerResponse,
    ): Promise<void> {
        const req = await Request.fromIncoming(rawReq as import('node:http').IncomingMessage)
        const res = new Response(rawRes as import('node:http').ServerResponse)
        const ctx = new HttpContext(req, res)

        try {
        const match = this.router.match(req.method, req.path)

        if (!match) {
            res.notFound(`Cannot ${req.method} ${req.path}`)
            return
        }

        req.setParams(match.params)

        const middleware = [
            ...this.router.globalMiddlewares,
            ...match.route.middleware,
        ]

        await new Pipeline(ctx)
            .through(middleware)
            .run(async (ctx: HttpContext) => {
                await match.route.handler(ctx)
            })
        } catch (error) {
            if (!res.sent) {
                const message = error instanceof Error ? error.message : 'Internal Server Error'
                res.serverError(message)
            }
        }
    }
}