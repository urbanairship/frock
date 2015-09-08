import http from 'http'

import bole from 'bole'
import arrayify from 'arrify'
import createDeter from 'deter'
import enableDestroy from 'server-destroy'

import {utilMiddleware, logMiddleware} from './middleware'
import {processMiddleware} from './utils'

export default createHttpServer

const log = bole('frock/core-httpsever')

function createHttpServer (frock, config, globalConfig, ready) {
  let constraints = config.connection || {}

  if (!constraints.whitelist && !constraints.blacklist) {
    constraints = globalConfig.connection
  }

  if (!config.middleware) {
    config.middleware = []
  }

  config.middleware.unshift({handler: utilMiddleware})

  const deter = createDeter(constraints, onWhitelistFail)
  const router = frock.router(defaultRoute, config.baseUrl)
  const perServerMiddleware = processMiddleware(
    frock,
    bole('middleware:${config.port}>'),
    config.options,
    config.middleware,
    deter(router)
  )
  const server = http.createServer(perServerMiddleware)

  const serverRoutes = config.routes || []
  const boundHandlers = []
  const errors = []

  // handle validation cases
  if (!serverRoutes.length) {
    log.warn(`server ${config.port} has no routes`)
  }

  if (!config.port || !Number.isInteger(config.port)) {
    let error = new Error(`no port defined for server, stopping setup early`)

    log.error(error, config)

    return ready(error)
  }

  serverRoutes.forEach(route => {
    const methods = arrayify(route.methods).map(m => m.toLowerCase())

    try {
      frock.registerHandler(route.handler)
    } catch (e) {
      errors.push(e)
      log.error(`error registering handler ${route.handler}`, e)
    }

    methods.forEach(method => {
      const logId = `${route.handler}:${config.port}>`
      const handlerFn = frock.handlers.get(route.handler)

      let handler

      if (!handlerFn) {
        let err = new Error(
          `${method} handler requested ${route.handler}, which wasn't available.`
        )

        log.error(err)
        errors.push(err)

        return
      }

      if (!route.options) {
        route.options = {}
      }

      if (!route.middleware) {
        route.middleware = []
      }

      route.middleware.unshift({handler: logMiddleware})

      // save the path for plugins that need to know it
      route.options._path = route.path
      route.options._middleware = route.middleware

      handler = handlerFn(
        frock,
        bole(logId),
        route.options,
        route.db ? frock.getOrCreateDb(route.db) : null
      )

      const middlewareProcessor = processMiddleware(
        frock,
        bole(logId),
        route.options,
        route.middleware,
        handler
      )

      router[method](
        route.path,
        middlewareProcessor
      )

      boundHandlers.push(handler)

      log.debug(`added route [${method}:${route.handler}] ${route.path}`)
    })
  })

  // start our servers
  server.on('error', function (e) {
    if (e.code === 'EADDRINUSE') {
      log(`port ${config.port} could not be bound, address in use`)
    }
    // TODO handle other things
  })
  server.listen(config.port)
  enableDestroy(server)

  ready(
    errors.length ? errors : null,
    {server, handlers: boundHandlers, port: config.port}
  )

  log.info(`started server ${config.port}`)
}

function defaultRoute (req, res) {
  const msg = `no route configured for ${req.url}`

  res.statusCode = 404
  res.end(msg)
  log.info(msg)
}

function onWhitelistFail (req, res) {
  const msg = 'access from non-whitelisted, or from blacklisted address'

  res.statusCode = 403
  res.end(msg)
  log.info(msg)
}
