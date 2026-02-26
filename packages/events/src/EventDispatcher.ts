import type { Event } from './events/Event.js'
import type { Listener } from './listeners/Listener.js'

type ListenerConstructor<T extends Event> = new () => Listener<T>
type ListenerFn<T extends Event> = (event: T) => Promise<void> | void
type AnyListener<T extends Event> = ListenerConstructor<T> | ListenerFn<T>

type EventConstructor<T extends Event = Event> = new (...args: never[]) => T

interface ListenerEntry<T extends Event> {
    listener: AnyListener<T>
    once: boolean
}

export class EventDispatcher {
    private readonly listeners = new Map<EventConstructor, ListenerEntry<Event>[]>()
    private readonly wildcardListeners: ListenerEntry<Event>[] = []

    // ─── Registration ─────────────────────────────────────────────────────────

    on<T extends Event>(
        event: EventConstructor<T>,
        listener: AnyListener<T>,
    ): this {
        return this.addListener(event, listener, false)
    }

    once<T extends Event>(
        event: EventConstructor<T>,
        listener: AnyListener<T>,
    ): this {
        return this.addListener(event, listener, true)
    }

    /** Listen to ALL events */
    onAny(listener: ListenerFn<Event>): this {
        this.wildcardListeners.push({ listener, once: false })
        return this
    }

    off<T extends Event>(
        event: EventConstructor<T>,
        listener: AnyListener<T>,
    ): this {
        const entries = this.listeners.get(event)
        if (!entries) return this
        const filtered = entries.filter((e) => e.listener !== listener)
        this.listeners.set(event, filtered)
        return this
    }

    // ─── Dispatching ──────────────────────────────────────────────────────────

    async dispatch<T extends Event>(event: T): Promise<void> {
        const EventClass = event.constructor as EventConstructor<T>
        const entries = this.listeners.get(EventClass) ?? []

        // Handle once listeners — remove before invoking to avoid double-fire
        const toRemove: ListenerEntry<Event>[] = []
        for (const entry of entries) {
        if (entry.once) toRemove.push(entry)
        }
        if (toRemove.length) {
        this.listeners.set(
            EventClass,
            entries.filter((e) => !toRemove.includes(e)),
        )
        }

        // Run all registered listeners concurrently
        await Promise.all([
        ...entries.map((entry) => this.invoke(entry.listener, event)),
        ...this.wildcardListeners.map((entry) => this.invoke(entry.listener, event)),
        ])
    }

    /** Dispatch without awaiting — fire and forget */
    dispatchSync<T extends Event>(event: T): void {
        void this.dispatch(event)
    }

    // ─── Introspection ────────────────────────────────────────────────────────

    hasListeners<T extends Event>(event: EventConstructor<T>): boolean {
        return (this.listeners.get(event)?.length ?? 0) > 0
    }

    listenerCount<T extends Event>(event: EventConstructor<T>): number {
        return this.listeners.get(event)?.length ?? 0
    }

    forget<T extends Event>(event: EventConstructor<T>): this {
        this.listeners.delete(event)
        return this
    }

    forgetAll(): this {
        this.listeners.clear()
        this.wildcardListeners.length = 0
        return this
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    private addListener<T extends Event>(
        event: EventConstructor<T>,
        listener: AnyListener<T>,
        once: boolean,
    ): this {
        const entries = this.listeners.get(event) ?? []
        entries.push({ listener: listener as AnyListener<Event>, once })
        this.listeners.set(event, entries)
        return this
    }

    private async invoke<T extends Event>(
        listener: AnyListener<T>,
        event: T,
    ): Promise<void> {
        if (typeof listener === 'function') {
        await (listener as ListenerFn<T>)(event)
        return
        }

        const instance = new (listener as ListenerConstructor<T>)()

        if (!instance.shouldHandle(event)) return

        let attempts = 0
        const maxAttempts = instance.retries + 1

        while (attempts < maxAttempts) {
        try {
            await instance.handle(event)
            return
        } catch (error) {
            attempts++
            if (attempts >= maxAttempts) throw error
        }
        }
    }
}