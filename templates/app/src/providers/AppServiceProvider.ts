import { ServiceProvider } from '@pearl/core'

export class AppServiceProvider extends ServiceProvider {
  register(): void {
    // Register your app's bindings here
  }

  override async boot(): Promise<void> {
    // Boot logic here
  }
}
