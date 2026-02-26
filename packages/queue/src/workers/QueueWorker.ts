import { Worker as BullWorker, type ConnectionOptions, type Job as BullJob } from 'bullmq'
import type { Job } from '../jobs/Job.js'

type JobConstructor = new (...args: never[]) => Job

export interface WorkerOptions {
  connection: ConnectionOptions
  prefix?: string
  concurrency?: number
}

/**
 * QueueWorker processes jobs from a named queue.
 *
 * Usage:
 *   const worker = new QueueWorker('default', options)
 *   worker.register(SendWelcomeEmail, ProcessPayment)
 *   worker.start()
 */
export class QueueWorker {
    private readonly registry = new Map<string, JobConstructor>()
    private worker?: BullWorker

    constructor(
        private readonly queueName: string,
        private readonly options: WorkerOptions,
    ) {}

    // ─── Registration ─────────────────────────────────────────────────────────

    register(...jobClasses: JobConstructor[]): this {
        for (const JobClass of jobClasses) {
            this.registry.set(JobClass.name, JobClass)
        }
        return this
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    start(): this {
        this.worker = new BullWorker(
        this.queueName,
        async (bullJob: BullJob) => {
            await this.process(bullJob)
        },
        {
            connection: this.options.connection,
            prefix: this.options.prefix ?? 'pearl',
            concurrency: this.options.concurrency ?? 5,
        },
        )

        this.worker.on('failed', async (bullJob, error) => {
        if (!bullJob) return
            await this.handleFailed(bullJob, error)
        })

        return this
    }

    async stop(): Promise<void> {
        await this.worker?.close()
    }

    // ─── Processing ───────────────────────────────────────────────────────────

    private async process(bullJob: BullJob): Promise<void> {
        const JobClass = this.registry.get(bullJob.name)

        if (!JobClass) {
            throw new Error(
                `No job registered for "${bullJob.name}" on queue "${this.queueName}". ` +
                `Did you forget to call worker.register(${bullJob.name})?`
            )
        }

        const job = Object.assign(new JobClass(), bullJob.data) as Job
        await job.handle()
    }

    private async handleFailed(bullJob: BullJob, error: Error): Promise<void> {
        const isLastAttempt =
        bullJob.attemptsMade >= (bullJob.opts.attempts ?? 1)

        if (!isLastAttempt) return

        const JobClass = this.registry.get(bullJob.name)
        if (!JobClass) return

        const job = Object.assign(new JobClass(), bullJob.data) as Job
        await job.failed(error)
    }
}