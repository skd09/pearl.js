/**
 * Factory generates test data with sensible defaults that can be overridden.
 *
 * Usage:
 *   const userFactory = new Factory(() => ({
 *     name:  faker.person.fullName(),
 *     email: faker.internet.email(),
 *     role:  'user',
 *   }))
 *
 *   const user  = userFactory.make()
 *   const admin = userFactory.make({ role: 'admin' })
 *   const users = userFactory.makeMany(5)
 *   const users = userFactory.makeMany(3, { role: 'admin' })
 */
export class Factory<T extends Record<string, unknown>> {
    constructor(private readonly definition: () => T) {}

    make(overrides?: Partial<T>): T {
        return { ...this.definition(), ...overrides } as T
    }

    makeMany(count: number, overrides?: Partial<T>): T[] {
        return Array.from({ length: count }, () => this.make(overrides))
    }

    /**
     * Create a new factory that extends this one with additional defaults.
     */
    state(overrides: Partial<T>): Factory<T> {
        return new Factory<T>(() => ({ ...this.definition(), ...overrides }))
    }
}