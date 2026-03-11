import { BindingNotFoundError, CircularDependencyError, ContainerFrozenError } from '../errors.js'
import type { Binding, BindingToken, Factory, IContainer } from './contracts.js'

export class Container implements IContainer {
    private readonly bindings = new Map<BindingToken, Binding<unknown>>()
    private readonly resolved = new Map<BindingToken, unknown>()
    private readonly resolutionStack: BindingToken[] = []
    private frozen = false

    bind<T>(token: BindingToken<T>, factory: Factory<T>): this {
        this.guardFrozen()
        this.bindings.set(token, { factory: factory as Factory<unknown>, singleton: false })
        return this
    }

    singleton<T>(token: BindingToken<T>, factory: Factory<T>): this {
        this.guardFrozen()
        this.bindings.set(token, { factory: factory as Factory<unknown>, singleton: true })
        return this
    }

    instance<T>(token: BindingToken<T>, value: T): this {
        this.guardFrozen()
        this.bindings.set(token, { factory: () => value, singleton: true })
        this.resolved.set(token, value)
        return this
    }

    make<T>(token: BindingToken<T>): T {
        const binding = this.bindings.get(token)
        if (binding === undefined) throw new BindingNotFoundError(this.tokenName(token))

        if (binding.singleton && this.resolved.has(token)) {
            return this.resolved.get(token) as T
        }

        this.detectCircularDependency(token)
        this.resolutionStack.push(token)

        let instance: T
        try {
            instance = binding.factory(this) as T
        } finally {
            this.resolutionStack.pop()
        }

        if (binding.singleton) this.resolved.set(token, instance)
        return instance
    }

    has<T>(token: BindingToken<T>): boolean {
        return this.bindings.has(token)
    }

    createScope(): IContainer {
        const scope = new Container()
        // Use the public API to copy bindings rather than bracket-accessing private fields
        scope.copyFrom(this.bindings, this.resolved)
        return scope
    }

    freeze(): void {
        this.frozen = true
    }

    /**
     * Internal method used by createScope() to copy parent bindings into a child scope.
     * Not part of the public IContainer interface.
     */
    protected copyFrom(
        bindings: Map<BindingToken, Binding<unknown>>,
        resolved: Map<BindingToken, unknown>,
    ): void {
        for (const [token, binding] of bindings) this.bindings.set(token, binding)
        for (const [token, value] of resolved) this.resolved.set(token, value)
    }

    private guardFrozen(): void {
        if (this.frozen) throw new ContainerFrozenError()
    }

    private detectCircularDependency(token: BindingToken): void {
        if (this.resolutionStack.includes(token)) {
            const chain = [...this.resolutionStack, token].map((t) => this.tokenName(t))
            throw new CircularDependencyError(chain)
        }
    }

    private tokenName(token: BindingToken): string {
        if (typeof token === 'symbol') return token.toString()
        if (typeof token === 'string') return token
        return token.name
    }
}