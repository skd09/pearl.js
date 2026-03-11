# @pearl-framework/events

> Type-safe event dispatcher and listener system for decoupling your services.

[![npm](https://img.shields.io/npm/v/@pearl-framework/events?color=a855f7&labelColor=111118&style=flat-square)](https://www.npmjs.com/package/@pearl-framework/events)

## Installation

```bash
npm install @pearl-framework/events @pearl-framework/core
```

---

## Overview

The events system lets services communicate without depending on each other directly. A `UserService` can dispatch `UserRegistered` without knowing anything about email or notifications — the listeners handle that.

---

## Define Events

An event is a plain class that carries data:

```typescript
import { Event } from '@pearl-framework/events'

export class UserRegistered extends Event {
  constructor(public readonly user: User) { super() }
}

export class OrderPlaced extends Event {
  constructor(
    public readonly order: Order,
    public readonly total: number,
  ) { super() }
}
```

---

## Define Listeners

A listener handles one event type:

```typescript
import { Listener } from '@pearl-framework/events'

export class SendWelcomeEmail extends Listener<UserRegistered> {
  async handle(event: UserRegistered): Promise<void> {
    await mailer.send(new WelcomeEmail(event.user))
  }
}

export class NotifyAdmins extends Listener<UserRegistered> {
  async handle(event: UserRegistered): Promise<void> {
    await mailer.send(new AdminNotification(event.user))
  }

  // Optional — return false to skip this listener without throwing
  shouldHandle(event: UserRegistered): boolean {
    return event.user.emailVerified
  }
}
```

---

## Dispatch Events

```typescript
import { EventDispatcher } from '@pearl-framework/events'

const dispatcher = new EventDispatcher()

// Register listeners
dispatcher.on(UserRegistered, SendWelcomeEmail)
dispatcher.on(UserRegistered, NotifyAdmins)

// Dispatch and await all listeners (recommended)
await dispatcher.dispatch(new UserRegistered(user))

// Fire-and-forget — does not await listeners
dispatcher.dispatchSync(new UserRegistered(user))
```

---

## EventServiceProvider

The recommended way to register all your event-listener mappings in one place:

```typescript
import { EventServiceProvider } from '@pearl-framework/events'

export class AppEventServiceProvider extends EventServiceProvider {
  protected listen = new Map([
    [UserRegistered, [SendWelcomeEmail, NotifyAdmins]],
    [OrderPlaced,    [SendOrderConfirmation, UpdateInventory]],
    [UserDeleted,    [CleanupUserData, RevokeTokens]],
  ])
}

// In your Application setup
app.register(AppEventServiceProvider)
```

---

## Injecting the Dispatcher

Use the IoC container to share a single `EventDispatcher` instance across your app:

```typescript
// In AppServiceProvider
register(): void {
  this.container.singleton(EventDispatcher, () => new EventDispatcher())
}

// In UserService
export class UserService {
  constructor(private readonly events: EventDispatcher) {}

  async register(data: CreateUserDto): Promise<User> {
    const user = await User.create(db, data)
    await this.events.dispatch(new UserRegistered(user))
    return user
  }
}
```

---

## API Reference

### `EventDispatcher`

| Method | Description |
|---|---|
| `on(EventClass, ListenerClass)` | Register a listener class for an event type |
| `dispatch(event)` | Dispatch and `await` all registered listeners |
| `dispatchSync(event)` | Dispatch without awaiting — listeners run in the background |

### `Listener<T>`

| Method | Description |
|---|---|
| `handle(event: T)` | **Required.** Called when the event is dispatched |
| `shouldHandle(event: T)` | Optional. Return `false` to skip this listener silently |