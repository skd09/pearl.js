import type { ZodTypeAny, infer as ZodInfer } from 'zod'
import type { HttpContext } from '@pearl/http'
import { ValidationException } from './ValidationException.js'

export abstract class FormRequest<TSchema extends ZodTypeAny = ZodTypeAny> {
    abstract readonly schema: TSchema

    authorize(_ctx: HttpContext): boolean | Promise<boolean> {
        return true
    }

    protected resolveInput(ctx: HttpContext): Record<string, unknown> {
        return {
            ...ctx.request.query,
            ...ctx.request.params,
            ...(ctx.request.body as Record<string, unknown>),
        }
    }

    async validate(ctx: HttpContext): Promise<ZodInfer<TSchema>> {
        const authorized = await this.authorize(ctx)
        if (!authorized) {
            ctx.response.forbidden('This action is unauthorized.')
            throw new Error('Unauthorized')
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