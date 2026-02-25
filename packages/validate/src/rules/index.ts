import { z } from 'zod'

/**
 * Common rule shorthands — use these in your FormRequest schemas
 * to avoid repeating the same patterns across requests.
 */
export const rules = {
    //  Strings
    required: () => z.string().min(1, 'This field is required.'),
    email: () => z.string().email('Must be a valid email address.'),
    url: () => z.string().url('Must be a valid URL.'),
    uuid: () => z.string().uuid('Must be a valid UUID.'),

    string: (min = 0, max?: number) => {
        let s = z.string().min(min, `Must be at least ${min} characters.`)
        if (max !== undefined) s = s.max(max, `Must be at most ${max} characters.`)
        return s
    },

    password: () =>
        z
        .string()
        .min(8, 'Password must be at least 8 characters.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(/[0-9]/, 'Password must contain at least one number.'),

    //  Numbers
    int: (min?: number, max?: number) => {
        let n = z.number().int('Must be a whole number.')
        if (min !== undefined) n = n.min(min, `Must be at least ${min}.`)
        if (max !== undefined) n = n.max(max, `Must be at most ${max}.`)
        return n
    },

    positiveInt: () => z.number().int().positive('Must be a positive number.'),

    //  Booleans
    boolean: () => z.boolean(),

    //  Dates──
    date: () => z.coerce.date(),
    futureDate: () => z.coerce.date().refine((d) => d > new Date(), 'Must be a future date.'),
    pastDate: () => z.coerce.date().refine((d) => d < new Date(), 'Must be a past date.'),

    //  Arrays─
    array: <T extends z.ZodTypeAny>(item: T, min = 0) =>
        z.array(item).min(min, `Must have at least ${min} item(s).`),

    //  Enums──
    enum: <T extends [string, ...string[]]>(values: T) =>
        z.enum(values, { errorMap: () => ({ message: `Must be one of: ${values.join(', ')}.` }) }),

    //  IDs─
    id: () => z.number().int().positive('Must be a valid ID.'),
  slug: () => z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a valid slug (lowercase, hyphens only).'),
} as const