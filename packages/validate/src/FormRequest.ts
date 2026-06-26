import type { ZodTypeAny, infer as ZodInfer } from 'zod'
import type { HttpContext } from '@pearl-framework/http'
import { ValidationException } from './ValidationException.js'
import { AuthorizationException } from './AuthorizationException.js'

export abstract class FormRequest<TSchema extends ZodTypeAny = ZodTypeAny> {
    abstract readonly schema: TSchema

    authorize(_ctx: HttpContext): boolean | Promise<boolean> {
        return true
    }

    protected resolveInput(ctx: HttpContext): Record<string, unknown> {
        // Precedence, lowest to highest: body, then query, then route params.
        // Route params win so a request body cannot overwrite a trusted path
        // segment — e.g. a body of { id: 999 } cannot override /users/:id.
        return {
            ...(ctx.request.body as Record<string, unknown>),
            ...ctx.request.query,
            ...ctx.request.params,
        }
    }

    async validate(ctx: HttpContext): Promise<ZodInfer<TSchema>> {
        const authorized = await this.authorize(ctx)
        if (!authorized) {
            const exception = new AuthorizationException()
            ctx.response.forbidden(exception.message)
            throw exception
        }

        const input = this.resolveInput(ctx)
        const result = await this.schema.safeParseAsync(input)

        if (!result.success) {
            const exception = ValidationException.fromZodError(result.error)
            ctx.response.unprocessable(exception.errors)
            throw exception
        }

        return result.data as ZodInfer<TSchema>
    }

    /**
     * Static shorthand — two calling styles both work:
     *
     *   // Style 1 — static (most concise)
     *   const data = await RegisterRequest.validate(ctx)
     *
     *   // Style 2 — instance
     *   const data = await new RegisterRequest().validate(ctx)
     */
    static async validate<T extends FormRequest>(
        this: new () => T,
        ctx: HttpContext,
    ): Promise<ZodInfer<T['schema']>> {
        return new this().validate(ctx)
    }
}