import 'reflect-metadata'
import { CONTROLLER_PREFIX, CONTROLLER_MIDDLEWARE } from './metadata.js'
import type { Middleware } from '../routing/Pipeline.js'

/**
 * @Controller('/prefix')
 * Marks a class as a route controller and sets its route prefix.
 */
export function Controller(prefix = '', middleware: Middleware[] = []): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(CONTROLLER_PREFIX, prefix, target)
        Reflect.defineMetadata(CONTROLLER_MIDDLEWARE, middleware, target)
    }
}