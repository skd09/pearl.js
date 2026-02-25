/**
 * Base class for all Pearl events.
 *
 * Usage:
 *   export class UserRegistered extends Event {
 *     constructor(public readonly user: User) {
 *       super()
 *     }
 *   }
 */
export abstract class Event {
    /** Timestamp when the event was created */
    readonly timestamp: Date = new Date()

    /** Unique ID for this event instance */
    readonly eventId: string = crypto.randomUUID()

    /**
     * Override to broadcast this event over a channel (e.g. websockets).
     * Returns null by default (not broadcast).
     */
    broadcastOn(): string | string[] | null {
        return null
    }

    /**
     * Override to mark this event as queueable.
     * When true, listeners marked @Queued will run async via queue.
     */
    shouldQueue(): boolean {
        return false
    }
}