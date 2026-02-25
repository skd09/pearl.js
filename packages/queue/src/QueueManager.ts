import { Queue, type ConnectionOptions } from 'bullmq'
import type { Job } from './jobs/Job.js'

export interface QueueConfig {
  connection: ConnectionOptions
  prefix?: string
  defaultQueue?: string
}

export class QueueManager {
    private readonly queues = new Map<string, Queue>()
    private readonly config: QueueConfig

    constructor(config: QueueConfig) {
        this.config = {
        defaultQueue: 'default',
        prefix: 'pearl',
        ...config,
        }
    }

    // ─── Queue access ─────────────────────────────────────────────────────────

    queue(name?: string): Queue {
        const queueName = name ?? this.config.defaultQueue ?? 'default'

        if (!this.queues.has(queueName)) {
        this.queues.set(
            queueName,
            new Queue(queueName, {
            connection: this.config.connection,
            ...(this.config.prefix !== undefined && { prefix: this.config.prefix }),
            }),
        )
        }

        return this.queues.get(queueName)!
    }

    // ─── Dispatching ──────────────────────────────────────────────────────────

    async dispatch(job: Job): Promise<void> {
        const q = this.queue(job.queue)

        await q.add(job.jobName, job.serialize(), {
        ...job.jobOptions,
        delay: job.delay,
        })
    }

    async dispatchBulk(jobs: Job[]): Promise<void> {
        // Group by queue for efficient bulk add
        const groups = new Map<string, Job[]>()
        for (const job of jobs) {
        const name = job.queue ?? 'default'
        if (!groups.has(name)) groups.set(name, [])
        groups.get(name)!.push(job)
        }

        await Promise.all(
        [...groups.entries()].map(([queueName, queueJobs]) =>
            this.queue(queueName).addBulk(
            queueJobs.map((j) => ({
                name: j.jobName,
                data: j.serialize(),
                opts: { ...j.jobOptions, delay: j.delay },
            })),
            ),
        ),
        )
    }

    /** Dispatch a job after a delay (ms) */
    async dispatchAfter(job: Job, delayMs: number): Promise<void> {
        const q = this.queue(job.queue)
        await q.add(job.jobName, job.serialize(), {
        ...job.jobOptions,
        delay: delayMs,
        })
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    async closeAll(): Promise<void> {
        await Promise.all([...this.queues.values()].map((q) => q.close()))
        this.queues.clear()
    }
}