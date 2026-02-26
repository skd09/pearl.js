import type { Event } from '../events/Event.js'

/**
 * Base class for all Pearl event listeners.
 *
 * Usage:
 *   export class SendWelcomeEmail extends Listener<UserRegistered> {
 *     async handle(event: UserRegistered): Promise<void> {
 *       await mail.send(new WelcomeEmail(event.user))
 *     }
 *   }
 */
export abstract class Listener<TEvent extends Event = Event> {
    /**
     * Handle the event.
     */
    abstract handle(event: TEvent): Promise<void> | void

    /**
     * Override to conditionally handle the event.
     * Return false to skip handling.
     */
    shouldHandle(_event: TEvent): boolean {
        return true
    }

    /**
     * Number of times to retry on failure (default: 0).
     */
    get retries(): number {
        return 0
    }
}