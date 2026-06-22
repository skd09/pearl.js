import { describe, it, expect, vi } from 'vitest'
import { EventDispatcher } from './EventDispatcher.js'
import { Event } from './events/Event.js'
import { Listener } from './listeners/Listener.js'

class TestEvent extends Event {
    constructor(public readonly payload: string) {
        super()
    }
}

describe('EventDispatcher class-listener invocation', () => {
    it('invokes a Listener subclass with `new`, not as a function', async () => {
        let calledWith: TestEvent | null = null

        class MyListener extends Listener<TestEvent> {
            async handle(event: TestEvent): Promise<void> {
                calledWith = event
            }
        }

        const d = new EventDispatcher()
        d.on(TestEvent, MyListener)

        const ev = new TestEvent('payload')
        await d.dispatch(ev)

        expect(calledWith).toBe(ev)
    })

    it('still works for plain function listeners', async () => {
        const fn = vi.fn()
        const d = new EventDispatcher()
        d.on(TestEvent, fn)
        await d.dispatch(new TestEvent('x'))
        expect(fn).toHaveBeenCalledTimes(1)
    })
})

describe('EventDispatcher.dispatchSync error handling', () => {
    it('routes uncaught listener errors through onError', async () => {
        const dispatcher = new EventDispatcher()
        const onError = vi.fn()
        dispatcher.onError(onError)

        dispatcher.on(TestEvent, () => {
            throw new Error('boom')
        })

        dispatcher.dispatchSync(new TestEvent('x'))

        // Allow microtask + the promise chain to settle
        await new Promise((r) => setTimeout(r, 0))

        expect(onError).toHaveBeenCalledTimes(1)
        const [err, event] = onError.mock.calls[0]!
        expect((err as Error).message).toBe('boom')
        expect(event).toBeInstanceOf(TestEvent)
    })

    it('falls back to console.error when no handler is set', async () => {
        const dispatcher = new EventDispatcher()
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

        dispatcher.on(TestEvent, () => {
            throw new Error('boom')
        })
        dispatcher.dispatchSync(new TestEvent('x'))
        await new Promise((r) => setTimeout(r, 0))

        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
    })

    it('survives an error handler that itself throws', async () => {
        const dispatcher = new EventDispatcher()
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        dispatcher.onError(() => {
            throw new Error('handler died')
        })
        dispatcher.on(TestEvent, () => {
            throw new Error('inner')
        })
        dispatcher.dispatchSync(new TestEvent('x'))
        await new Promise((r) => setTimeout(r, 0))

        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
    })
})
