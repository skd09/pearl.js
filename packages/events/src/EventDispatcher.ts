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

export type EventErrorHandler = (err: unknown, event: Event) => void

export class EventDispatcher {
    private readonly listeners = new Map<EventConstructor, ListenerEntry<Event>[]>()
    private readonly wildcardListeners: ListenerEntry<Event>[] = []
    private errorHandler: EventErrorHandler | null = null

    /**
     * Register a global error handler for unhandled listener errors during
     * `dispatchSync`. Replaces the default console.error behavior so APM /
     * Sentry / etc. can observe failures. Pass `null` to restore default.
     */
    onError(handler: EventErrorHandler | null): this {
        this.errorHandler = handler
        return this
    }

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

    /** Listen to ALL events — fires once then removes itself */
    onceAny(listener: ListenerFn<Event>): this {
        this.wildcardListeners.push({ listener, once: true })
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

        // Snapshot wildcard listeners and remove any once-entries before invoking
        const wildcardSnapshot = [...this.wildcardListeners]
        const hasOnceWildcards = wildcardSnapshot.some((e) => e.once)
        if (hasOnceWildcards) {
            this.wildcardListeners.length = 0
            for (const entry of wildcardSnapshot) {
                if (!entry.once) this.wildcardListeners.push(entry)
            }
        }

        // Run all registered listeners concurrently
        await Promise.all([
        ...entries.map((entry) => this.invoke(entry.listener, event)),
        ...wildcardSnapshot.map((entry) => this.invoke(entry.listener, event)),
        ])
    }

    /**
     * Dispatch without awaiting — fire and forget.
     * Unhandled listener errors are routed through the registered
     * `onError` handler, falling back to console.error.
     */
    dispatchSync<T extends Event>(event: T): void {
        this.dispatch(event).catch((err) => {
            if (this.errorHandler) {
                try {
                    this.errorHandler(err, event)
                } catch (handlerErr) {
                    console.error('[EventDispatcher] onError handler itself threw:', handlerErr)
                    console.error('[EventDispatcher] Original listener error:', err)
                }
                return
            }
            console.error('[EventDispatcher] Uncaught error in listener:', err)
        })
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
        // Both classes and plain functions are typeof === 'function' in JS, so
        // typeof alone can't tell them apart — when a Listener subclass is
        // registered, calling it directly throws "Class constructor cannot be
        // invoked without 'new'". Discriminate by checking for the prototype's
        // `handle` method (only Listener subclasses have it).
        const isListenerClass =
            typeof listener === 'function' &&
            typeof (listener as ListenerConstructor<T>).prototype?.handle === 'function'

        if (!isListenerClass) {
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