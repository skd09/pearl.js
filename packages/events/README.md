# @pearl/events

> Type-safe event dispatcher and listener system for Pearl.js

## Installation

```bash
pnpm add @pearl/events @pearl/core
```

## Usage

### Define events and listeners

```ts
import { Event, Listener } from '@pearl/events'

export class UserRegistered extends Event {
  constructor(public readonly user: User) { super() }
}

export class SendWelcomeEmail extends Listener<UserRegistered> {
  async handle(event: UserRegistered): Promise<void> {
    await mailer.send(new WelcomeEmail(event.user))
  }

  // optional: skip handling under conditions
  shouldHandle(event: UserRegistered): boolean {
    return event.user.emailVerified
  }
}
```

### Dispatch events

```ts
import { EventDispatcher } from '@pearl/events'

const dispatcher = new EventDispatcher()
dispatcher.on(UserRegistered, SendWelcomeEmail)

await dispatcher.dispatch(new UserRegistered(user))
dispatcher.dispatchSync(new UserRegistered(user)) // fire and forget
```

### EventServiceProvider

```ts
import { EventServiceProvider } from '@pearl/events'

export class AppEventServiceProvider extends EventServiceProvider {
  protected listen = new Map([
    [UserRegistered, [SendWelcomeEmail, NotifyAdmins]],
    [OrderPlaced,    [SendOrderConfirmation, UpdateInventory]],
  ])
}
```

---