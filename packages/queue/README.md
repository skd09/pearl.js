# @pearl/queue

> BullMQ-powered job dispatching and worker management for Pearl.js

## Installation

```bash
pnpm add @pearl/queue @pearl/core bullmq ioredis
```

## Usage

### Define a job

```ts
import { Job } from '@pearl/queue'

export class SendWelcomeEmail extends Job {
  readonly queue = 'mail'
  get tries() { return 3 }
  get retryDelay() { return 2000 }

  constructor(public readonly userId: number) { super() }

  async handle(): Promise<void> {
    const user = await User.find(db, this.userId)
    await mailer.send(new WelcomeEmail(user))
  }

  async failed(error: Error): Promise<void> {
    console.error(`Failed for user ${this.userId}:`, error.message)
  }
}
```

### Dispatch jobs

```ts
const queue = app.make(QueueManager)

await queue.dispatch(new SendWelcomeEmail(user.id))
await queue.dispatchAfter(new SendWelcomeEmail(user.id), 5_000) // 5s delay
await queue.dispatchBulk([
  new SendWelcomeEmail(1),
  new SendWelcomeEmail(2),
])
```

### QueueServiceProvider

```ts
export class AppQueueServiceProvider extends QueueServiceProvider {
  protected config = {
    connection: { host: process.env.REDIS_HOST!, port: 6379 },
    workers: [
      { queue: 'default', concurrency: 5 },
      { queue: 'mail',    concurrency: 2 },
    ],
  }
}
```

---