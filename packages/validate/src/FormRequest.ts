import type { ZodSchema, ZodTypeAny, infer as ZodInfer } from 'zod'
import type { HttpContext } from '@pearl/http'
import { ValidationException } from './ValidationException.js'

/**
 * FormRequest is the base class for all validated request objects.
 *
 * Usage:
 *   class CreatePostRequest extends FormRequest {
 *     schema = z.object({
 *       title: z.string().min(1),
 *       body:  z.string().min(10),
 *     })
 *
 *     authorize(ctx: HttpContext): boolean {
 *       return ctx.has('user')
 *     }
 *   }
 *
 *   // In your controller:
 *   const data = await CreatePostRequest.validate(ctx)
 *   // data.title, data.body — fully typed
 */
export abstract class FormRequest<TSchema extends ZodTypeAny = ZodTypeAny> {
    abstract readonly schema: TSchema

    /**
     * Override to add authorization logic.
     * Return false to send a 403 Forbidden response.
     */
    authorize(_ctx: HttpContext): boolean | Promise<boolean> {
        return true
    }

    /**
     * Merge sources to validate — body + params + query, in that order.
     * Override to customize which sources are merged.
     */
    protected resolveInput(ctx: HttpContext): Record<string, unknown> {
        return {
        ...ctx.request.query,
        ...ctx.request.params,
        ...(ctx.request.body as Record<string, unknown>),
        }
    }

    /**
     * Run authorization + validation.
     * Throws ValidationException or sends 403 on failure.
     */
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
     * Static shorthand — no need to instantiate manually.
     *
     * const data = await CreatePostRequest.validate(ctx)
     */
    static async validate<T extends FormRequest>(
        this: new () => T,
        ctx: HttpContext,
    ): Promise<ZodInfer<T['schema']>> {
        const instance = new this()
        return instance.validate(ctx)
    }
}