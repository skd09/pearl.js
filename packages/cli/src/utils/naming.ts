/**
 * Converts a name to PascalCase.
 * e.g. "user-profile" → "UserProfile", "userProfile" → "UserProfile"
 */
export function toPascalCase(name: string): string {
  return name
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

/**
 * Converts a name to camelCase.
 */
export function toCamelCase(name: string): string {
    const pascal = toPascalCase(name);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Converts a name to kebab-case.
 * e.g. "UserProfile" → "user-profile"
 */
export function toKebabCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase();
    }

/**
 * Converts a name to snake_case.
 * e.g. "UserProfile" → "user_profile"
 */
export function toSnakeCase(name: string): string {
    return toKebabCase(name).replace(/-/g, '_');
}

/**
 * Strips common suffixes for clean base naming.
 * e.g. "UserController" → "User"
 */
export function stripSuffix(name: string, suffix: string): string {
    if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
        return name.slice(0, -suffix.length);
    }
    return name;
}