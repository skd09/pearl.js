import type { HttpContext } from '../http/HttpContext.js'

export type NextFn = () => Promise<void>

export type MiddlewareFn = (ctx: HttpContext, next: NextFn) => Promise<void>

export interface MiddlewareClass {
    handle(ctx: HttpContext, next: NextFn): Promise<void>
}

export type Middleware = MiddlewareFn | MiddlewareClass

function isMiddlewareClass(m: Middleware): m is MiddlewareClass {
    return typeof (m as MiddlewareClass).handle === 'function'
}

/**
 * Pipeline executes a stack of middleware in order,
 * each calling next() to pass control to the next layer.
 *
 * Usage:
 *   await new Pipeline(ctx).through(middlewares).run(finalHandler)
 */
export class Pipeline {
    private middleware: Middleware[] = []

    constructor(private readonly ctx: HttpContext) {}

    through(middleware: Middleware[]): this {
        this.middleware = middleware
        return this
    }

    async run(destination: (ctx: HttpContext) => Promise<void>): Promise<void> {
        const stack = [...this.middleware]

        const dispatch = async (index: number): Promise<void> => {
            if (index === stack.length) return destination(this.ctx)

            const current = stack[index]
            if (!current) return destination(this.ctx)
            const next: NextFn = () => dispatch(index + 1)

            if (isMiddlewareClass(current)) {
                await current.handle(this.ctx, next)
            } else {
                await (current as MiddlewareFn)(this.ctx, next)
            }
        }

        await dispatch(0)
    }
}