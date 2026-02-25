import 'reflect-metadata'
import { ROUTE_DEFINITIONS } from './metadata.js'
import type { HttpMethod } from '../routing/Router.js'
import type { Middleware } from '../routing/Pipeline.js'

export interface RouteDefinition {
  method: HttpMethod
  path: string
  handlerName: string
  middleware: Middleware[]
}

function createRouteDecorator(method: HttpMethod) {
    return (path = '/', middleware: Middleware[] = []): MethodDecorator => {
        return (target, propertyKey) => {
            const existing: RouteDefinition[] =
                Reflect.getMetadata(ROUTE_DEFINITIONS, target.constructor) ?? []

            existing.push({
                method,
                path,
                handlerName: String(propertyKey),
                middleware,
            })

            Reflect.defineMetadata(ROUTE_DEFINITIONS, existing, target.constructor)
        }
    }
}

export const Get = createRouteDecorator('GET')
export const Post = createRouteDecorator('POST')
export const Put = createRouteDecorator('PUT')
export const Patch = createRouteDecorator('PATCH')
export const Delete = createRouteDecorator('DELETE')