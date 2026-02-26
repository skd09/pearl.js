import { ServiceProvider } from '@pearljs/core'
import { EventDispatcher } from '../EventDispatcher.js'
import type { Event } from '../events/Event.js'
import type { Listener } from '../listeners/Listener.js'

type EventConstructor<T extends Event = Event> = new (...args: never[]) => T
type ListenerConstructor<T extends Event = Event> = new () => Listener<T>

export type EventMap = Map<EventConstructor, ListenerConstructor[]>

/**
 * EventServiceProvider registers the EventDispatcher into the container
 * and wires up all event → listener mappings.
 *
 * Usage — extend this in your app:
 *
 *   export class AppEventServiceProvider extends EventServiceProvider {
 *     protected listen: EventMap = new Map([
 *       [UserRegistered, [SendWelcomeEmail, NotifyAdmins]],
 *       [OrderPlaced,    [SendOrderConfirmation]],
 *     ])
 *   }
 */
export class EventServiceProvider extends ServiceProvider {
    /**
     * Override in your app to define event → listener mappings.
     */
    protected listen: EventMap = new Map()

    register(): void {
        this.container.singleton(EventDispatcher, () => new EventDispatcher())
    }

    override boot(): void {
        const dispatcher = this.container.make(EventDispatcher)

        for (const [EventClass, listenerClasses] of this.listen) {
        for (const ListenerClass of listenerClasses) {
            dispatcher.on(EventClass, ListenerClass)
        }
        }
    }
}