export abstract class TestCase {
    async setUp(): Promise<void> {}
    async tearDown(): Promise<void> {}

    static describe(label: string, TestClass: new () => TestCase): void {
        const instance = new TestClass()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { describe, beforeEach, afterEach, it } = globalThis as any

        describe(label, () => {
        beforeEach(() => instance.setUp())
        afterEach(() => instance.tearDown())

        const proto = Object.getPrototypeOf(instance) as Record<string, unknown>
            for (const key of Object.getOwnPropertyNames(proto)) {
                if (key.startsWith('test') && typeof proto[key] === 'function') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    it(key, () => (instance as any)[key]())
                }
            }
        })
    }
}