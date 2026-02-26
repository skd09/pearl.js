import type { IContainer } from './container/contracts.js'

export abstract class ServiceProvider {
  constructor(protected readonly container: IContainer) {}

  abstract register(): void

  boot(): void | Promise<void> {}
}
