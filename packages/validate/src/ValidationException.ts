import { PearlError } from '@pearl/core'
import type { ZodError } from 'zod'

export type ValidationErrors = Record<string, string[]>

export class ValidationException extends PearlError {
    readonly code = 'VALIDATION_FAILED'
    readonly errors: ValidationErrors

    constructor(errors: ValidationErrors) {
        super('The given data was invalid.')
        this.errors = errors
    }

    static fromZodError(error: ZodError): ValidationException {
        const errors: ValidationErrors = {}

        for (const issue of error.issues) {
        const key = issue.path.join('.') || '_root'
        if (!errors[key]) errors[key] = []
        errors[key].push(issue.message)
        }

        return new ValidationException(errors)
    }

    toJSON(): { message: string; errors: ValidationErrors } {
        return {
        message: this.message,
        errors: this.errors,
        }
    }
}