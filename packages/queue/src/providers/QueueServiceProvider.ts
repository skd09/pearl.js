import { ServiceProvider } from '@pearl/core'
import { QueueManager } from '../QueueManager.js'
import { QueueWorker } from '../workers/QueueWorker.js'
import type { ConnectionOptions } from 'bullmq'

export interface QueueServiceConfig {
  connection: ConnectionOptions
  prefix?: string
  defaultQueue?: string
  workers?: Array<{
    queue: string
    concurrency?: number
  }>
}

/**
 * QueueServiceProvider registers the QueueManager into the container.
 *
 * Usage — extend this in your app:
 *
 *   export class AppQueueServiceProvider extends QueueServiceProvider {
 *     protected config: QueueServiceConfig = {
 *       connection: { host: env('REDIS_HOST'), port: env.number('REDIS_PORT') },
 *       defaultQueue: 'default',
 *       workers: [
 *         { queue: 'default', concurrency: 5 },
 *         { queue: 'mail',    concurrency: 2 },
 *       ],
 *     }
 *   }
 */
export class QueueServiceProvider extends ServiceProvider {
    protected config: QueueServiceConfig = {
        connection: { host: 'localhost', port: 6379 },
    }

    private workers: QueueWorker[] = []

    register(): void {
        this.container.singleton(
        QueueManager,
        () => new QueueManager(this.config),
        )
    }

    override async boot(): Promise<void> {
        if (!this.config.workers?.length) return

        const manager = this.container.make(QueueManager)

        for (const workerConfig of this.config.workers) {
        const worker = new QueueWorker(workerConfig.queue, {
            connection: this.config.connection,
            ...(this.config.prefix !== undefined && { prefix: this.config.prefix }),
            ...(workerConfig.concurrency !== undefined && { concurrency: workerConfig.concurrency }),
        })

        this.workers.push(worker)
        worker.start()
        // Access queue to ensure it's initialised
        manager.queue(workerConfig.queue)
        }
    }

    async shutdown(): Promise<void> {
        const manager = this.container.make(QueueManager)
        await Promise.all(this.workers.map((w) => w.stop()))
        await manager.closeAll()
    }
}