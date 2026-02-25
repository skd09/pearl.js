import { ServiceProvider } from '@pearl/core'
import type { HttpContext, NextFn } from '@pearl/http'
import { ValidationException } from './ValidationException.js'

/**
 * ValidateServiceProvider registers a global error handler
 * that catches ValidationExceptions and formats them as 422 responses.
 *
 * Register in your application:
 *   app.register(ValidateServiceProvider)
 */
export class ValidateServiceProvider extends ServiceProvider {
    register(): void {
        // Register a global validation error handler token in the container
        this.container.instance('validate.exceptionHandler', this.handleValidationError)
    }

    private handleValidationError(
        error: unknown,
        ctx: HttpContext,
        _next: NextFn,
    ): boolean {
        if (error instanceof ValidationException) {
        ctx.response.unprocessable(error.errors)
        return true
        }
        return false
    }
}