import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Container } from './container/Container.js'
import type { IContainer } from './container/contracts.js'
import { Config, loadDotenv } from './Config.js'
import { ServiceProvider } from './ServiceProvider.js'
import { ProviderBootError } from './errors.js'

export interface ApplicationOptions {
  root?: string
  configPath?: string
}

type ProviderConstructor = new (container: IContainer) => ServiceProvider

function defaultRoot(): string {
  // Walk up from this file to find a sensible default root
  try {
    return fileURLToPath(new URL('../../..', import.meta.url))
  } catch {
    return process.cwd()
  }
}

export class Application {
  readonly container: IContainer
  readonly config: Config
  private readonly providers: ServiceProvider[] = []
  private booted = false
  private readonly options: Required<ApplicationOptions>

  constructor(options: ApplicationOptions = {}) {
    this.options = {
      root:       options.root       ?? process.cwd(),
      configPath: options.configPath ?? resolve(options.root ?? process.cwd(), 'config'),
    }

    this.container = new Container()
    this.config = new Config(this.options.configPath)
    this.container.instance(Application, this)
    this.container.instance(Config, this.config)
    this.container.instance<string>('app.root', this.options.root)
  }

  register(...providerClasses: ProviderConstructor[]): this {
    if (this.booted) throw new Error('Cannot register providers after the application has booted.')
    for (const ProviderClass of providerClasses) {
      this.providers.push(new ProviderClass(this.container))
    }
    return this
  }

  async boot(): Promise<this> {
    if (this.booted) return this

    loadDotenv(this.options.root)
    await this.config.load()

    for (const provider of this.providers) provider.register()

    for (const provider of this.providers) {
      try {
        await provider.boot()
      } catch (cause) {
        throw new ProviderBootError(provider.constructor.name, cause)
      }
    }

    if (this.container instanceof Container) this.container.freeze()
    this.booted = true
    return this
  }

  async terminate(): Promise<void> {
    for (const provider of [...this.providers].reverse()) {
      if ('shutdown' in provider && typeof provider.shutdown === 'function') {
        await (provider as { shutdown(): Promise<void> }).shutdown()
      }
    }
  }

  get isBooted(): boolean { return this.booted }
  get root(): string { return this.options.root }
}