import type { ZodSchema, infer as ZodInfer } from 'zod'
import { ValidationException } from './ValidationException.js'

/**
 * Standalone validate() helper for quick inline validation.
 *
 * Usage:
 *   const data = await validate(schema, ctx.request.body)
 *
 * Throws ValidationException on failure.
 */
export async function validate<T extends ZodSchema>(
  schema: T,
  data: unknown,
): Promise<ZodInfer<T>> {
    const result = await schema.safeParseAsync(data)

    if (!result.success) {
        throw ValidationException.fromZodError(result.error)
    }

    return result.data as ZodInfer<T>
}

/**
 * validateSync() — synchronous version.
 * Use when async is not needed (no async refinements in schema).
 */
export function validateSync<T extends ZodSchema>(
  schema: T,
  data: unknown,
): ZodInfer<T> {
    const result = schema.safeParse(data)

    if (!result.success) {
        throw ValidationException.fromZodError(result.error)
    }

    return result.data as ZodInfer<T>
}