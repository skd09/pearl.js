/**
 * Converts a name to PascalCase.
 * Handles kebab-case, snake_case, camelCase and PascalCase input.
 * e.g. "user-profile" → "UserProfile"
 *      "welcome_email" → "WelcomeEmail"
 *      "WelcomeEmail"  → "WelcomeEmail"  (preserved as-is)
 *      "welcomeEmail"  → "WelcomeEmail"
 */
export function toPascalCase(name: string): string {
    // If already PascalCase (starts with uppercase, no separators), return as-is
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        return name
    }

    return name
        .replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())
        .replace(/^(.)/, (_, c: string) => c.toUpperCase())
}

/**
 * Converts a name to camelCase.
 */
export function toCamelCase(name: string): string {
    const pascal = toPascalCase(name)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * Converts a name to kebab-case.
 * e.g. "UserProfile" → "user-profile"
 */
export function toKebabCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase()
}

/**
 * Converts a name to snake_case.
 * e.g. "UserProfile" → "user_profile"
 */
export function toSnakeCase(name: string): string {
    return toKebabCase(name).replace(/-/g, '_')
}

/**
 * Strips common suffixes for clean base naming.
 * e.g. "UserController" → "User"
 */
export function stripSuffix(name: string, suffix: string): string {
    if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
        return name.slice(0, -suffix.length)
    }
    return name
}