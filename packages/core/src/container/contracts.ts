export type BindingToken<T = unknown> = symbol | string | (abstract new (...args: never[]) => T)
export type Factory<T> = (container: IContainer) => T

export interface Binding<T> {
    readonly factory: Factory<T>
    readonly singleton: boolean
}

export interface IContainer {
    bind<T>(token: BindingToken<T>, factory: Factory<T>): this
    singleton<T>(token: BindingToken<T>, factory: Factory<T>): this
    instance<T>(token: BindingToken<T>, value: T): this
    make<T>(token: BindingToken<T>): T
    has<T>(token: BindingToken<T>): boolean
    createScope(): IContainer
}
