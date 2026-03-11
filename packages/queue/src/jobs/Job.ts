import type { JobsOptions } from 'bullmq'

/**
 * Base class for all Pearl jobs.
 *
 * IMPORTANT: Job subclasses must be deserializable without constructor arguments.
 * The QueueWorker reconstructs jobs using `new JobClass()` and then applies
 * serialized data via `Object.assign`. Design your job's payload as plain
 * public properties rather than constructor parameters:
 *
 * ✅ Correct pattern:
 *   export class SendWelcomeEmail extends Job {
 *     readonly queue = 'mail'
 *     userId!: number   // assigned by QueueWorker via Object.assign
 *
 *     async handle(): Promise<void> {
 *       const user = await User.find(this.userId)
 *       await mail.send(new WelcomeEmail(user))
 *     }
 *   }
 *
 *   // Dispatch:
 *   const job = new SendWelcomeEmail()
 *   job.userId = user.id
 *   await queue.dispatch(job)
 *
 * ❌ Incorrect (constructor args won't survive serialization):
 *   export class SendWelcomeEmail extends Job {
 *     constructor(public readonly userId: number) { super() }  // ← broken
 *   }
 */
export abstract class Job {
    /** Queue name to dispatch to (default: 'default') */
    readonly queue: string = 'default'

    /** BullMQ job options — override to customise delay, priority, etc. */
    get jobOptions(): JobsOptions {
        return {
            attempts: this.tries,
            backoff: {
                type: 'exponential',
                delay: this.retryDelay,
            },
            removeOnComplete: true,
            removeOnFail: false,
        }
    }

    /** Number of attempts before marking as failed (default: 3) */
    get tries(): number {
        return 3
    }

    /** Initial retry delay in ms (default: 1000, doubles each retry) */
    get retryDelay(): number {
        return 1000
    }

    /** Delay before the job runs in ms (default: 0) */
    get delay(): number {
        return 0
    }

    /**
     * The job's main logic. Implement this in your job class.
     */
    abstract handle(): Promise<void>

    /**
     * Called when all retry attempts are exhausted.
     * Override to send alerts, clean up, etc.
     */
    async failed(_error: Error): Promise<void> {}

    /**
     * Serialise job data for BullMQ storage.
     * Only plain enumerable properties are included.
     * Override if you need custom serialisation.
     */
    serialize(): Record<string, unknown> {
        const data: Record<string, unknown> = {}
        for (const key of Object.keys(this)) {
            if (key === 'queue') continue
            data[key] = (this as Record<string, unknown>)[key]
        }
        return data
    }

    /**
     * Job name used in BullMQ — defaults to class name.
     */
    get jobName(): string {
        return this.constructor.name
    }
}