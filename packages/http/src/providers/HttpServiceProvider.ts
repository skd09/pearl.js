import { ServiceProvider } from '@pearl-framework/core'
import { HttpKernel } from '../HttpKernel.js'
import { Router } from '../routing/Router.js'

export class HttpServiceProvider extends ServiceProvider {
    register(): void {
        this.container.singleton(Router, () => new Router())
            this.container.singleton(HttpKernel, (c) => {
            const kernel = new HttpKernel()
            kernel.useRouter(c.make(Router))
            return kernel
        })
    }
}