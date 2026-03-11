# @pearl-framework/queue

> BullMQ-powered background job queue with retry, backoff, and worker management.

[![npm](https://img.shields.io/npm/v/@pearl-framework/queue?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/queue)

## Installation

```bash
npm install @pearl-framework/queue @pearl-framework/core bullmq ioredis
```

Requires a running Redis instance. The default connection is `localhost:6379`.

---

## Define a Job

> **Important:** Job payload must be plain public properties, not constructor arguments. The worker reconstructs jobs using `new JobClass()` then restores data via `Object.assign`. Constructor arguments are lost after serialization.

```typescript
import { Job } from '@pearl-framework/queue'

export class SendWelcomeEmail extends Job {
  readonly queue   = 'mail'
  get tries()      { return 3 }
  get retryDelay() { return 2_000 }

  userId!: number 

  async handle(): Promise<void> {
    const user = await User.find(db, this.userId)
    if (!user) return
    await mailer.send(new WelcomeEmail(user))
  }

  async failed(error: Error): Promise<void> {
    // Called when all retry attempts are exhausted
    console.error(`SendWelcomeEmail failed for user ${this.userId}:`, error.message)
    await alertSlack(`Job failed: ${error.message}`)
  }
}
```

---

## Dispatch Jobs

```typescript
const queue = app.make(QueueManager)

// Dispatch immediately
const job = new SendWelcomeEmail()
job.userId = user.id
await queue.dispatch(job)

// Dispatch with a delay
await queue.dispatchAfter(job, 5_000)  // runs in 5 seconds

// Dispatch multiple
await queue.dispatchBulk([
  Object.assign(new SendWelcomeEmail(), { userId: 1 }),
  Object.assign(new SendWelcomeEmail(), { userId: 2 }),
  Object.assign(new SendWelcomeEmail(), { userId: 3 }),
])
```

---

## QueueServiceProvider

Register and configure queues and workers through the service provider:

```typescript
import { QueueServiceProvider } from '@pearl-framework/queue'

export class AppQueueServiceProvider extends QueueServiceProvider {
  protected config = {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
    workers: [
      { queue: 'default', concurrency: 5 },
      { queue: 'mail',    concurrency: 2 },
      { queue: 'reports', concurrency: 1 },
    ],
  }
}

app.register(AppQueueServiceProvider)
```

---

## Custom Job Options

Override `jobOptions` for full control over BullMQ options on a per-job basis:

```typescript
import type { JobsOptions } from 'bullmq'

export class ProcessReport extends Job {
  readonly queue = 'reports'
  reportId!: number

  // Override for full BullMQ options
  get jobOptions(): JobsOptions {
    return {
      attempts:         5,
      backoff:          { type: 'fixed', delay: 30_000 },  // fixed 30s between retries
      removeOnComplete: true,
      removeOnFail:     false,   // keep failed jobs for inspection
      priority:         10,
    }
  }

  async handle(): Promise<void> {
    await generateReport(this.reportId)
  }
}
```

---

## Multiple Queues

Use `readonly queue` to route different job types to dedicated workers:

```typescript
// High-priority jobs — 10 concurrent workers
export class ProcessPayment extends Job {
  readonly queue = 'critical'
  paymentId!: number
  async handle() { /* ... */ }
}

// Low-priority jobs — 1 worker
export class GenerateMonthlyReport extends Job {
  readonly queue = 'reports'
  month!: string
  async handle() { /* ... */ }
}
```

```typescript
// QueueServiceProvider config
workers: [
  { queue: 'default',  concurrency: 5 },
  { queue: 'critical', concurrency: 10 },
  { queue: 'reports',  concurrency: 1 },
]
```

---

## API Reference

### `Job` (base class)

| Property / Method | Default | Description |
|---|---|---|
| `queue` | `'default'` | Queue name to dispatch to |
| `tries` | `3` | Max attempts before marking failed |
| `retryDelay` | `1000` | Initial retry delay in ms (doubles each retry) |
| `delay` | `0` | Delay before first execution in ms |
| `jobOptions` | — | Override for full `JobsOptions` control |
| `handle()` | — | **Required.** The job's main logic |
| `failed(error)` | — | Called when all retry attempts are exhausted |
| `serialize()` | — | Serialises job payload for BullMQ — override for custom behaviour |

### `QueueManager`

| Method | Description |
|---|---|
| `dispatch(job)` | Add a job to its queue |
| `dispatchAfter(job, delayMs)` | Add a job with a delay before it runs |
| `dispatchBulk(jobs[])` | Add multiple jobs in a single operation |