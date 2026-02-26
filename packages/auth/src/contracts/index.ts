/**
 * AuthUser is the interface your User model must implement
 * to work with Pearl's auth guards.
 *
 * Usage:
 *   export class User implements AuthUser {
 *     constructor(
 *       public id: number | string,
 *       public email: string,
 *       public passwordHash: string,
 *     ) {}
 *
 *     getAuthIdentifier() { return this.id }
 *     getAuthPassword()   { return this.passwordHash }
 *   }
 */
export interface AuthUser {
    id: number | string
    getAuthIdentifier(): number | string
    getAuthPassword(): string
}

/**
 * UserProvider is responsible for retrieving users from your data store.
 * Implement this to connect auth to your database.
 */
export interface UserProvider<TUser extends AuthUser = AuthUser> {
    findById(id: number | string): Promise<TUser | null>
    findByCredentials(identifier: string, password: string): Promise<TUser | null>
}

/**
 * AuthGuard is the interface all guards implement.
 */
export interface AuthGuard<TUser extends AuthUser = AuthUser> {
    check(token: string): Promise<TUser | null>
    attempt(identifier: string, password: string): Promise<string | null>
    user(token: string): Promise<TUser | null>
}