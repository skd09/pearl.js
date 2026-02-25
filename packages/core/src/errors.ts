export abstract class PearlError extends Error {
    abstract readonly code: string

    constructor(message: string, public override readonly cause?: unknown) {
        super(message)
        this.name = this.constructor.name
    }
}

export class BindingNotFoundError extends PearlError {
    readonly code = 'BINDING_NOT_FOUND'
    constructor(token: string) {
        super(
            `No binding registered for "${token}". ` +
            `Did you forget to register a Service Provider?`
        )
    }
}

export class CircularDependencyError extends PearlError {
    readonly code = 'CIRCULAR_DEPENDENCY'
    constructor(chain: string[]) {
        super(
            `Circular dependency detected: ${chain.join(' → ')}. ` +
            `Review your Service Provider bindings.`
        )
    }
}

export class ContainerFrozenError extends PearlError {
    readonly code = 'CONTAINER_FROZEN'
    constructor() {
        super(
            `Cannot modify container bindings after it has been frozen. ` +
            `Create a new scope using createScope() to register additional bindings.`
        )
    }
}

export class ProviderBootError extends PearlError {
    readonly code = 'PROVIDER_BOOT_ERROR'
    constructor(providerName: string, cause?: unknown) {
        super(
            `Service Provider "${providerName}" failed to boot.`,
            cause
        )
    }
}


