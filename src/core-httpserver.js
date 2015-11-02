const http = require('http')

const bole = require('bole')
const arrayify = require('arrify')
const createDeter = require('deter')
import enableDestroy from 'server-destroy'

const {utilMiddleware, logMiddleware} = require('./middleware')
const {processMiddleware, handleServerError} = require('./utils')

const log = bole('frock/core-httpsever')

module.exports = createHttpServer

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
  const boundMiddlewares = [perServerMiddleware]

  // handle validation cases
  if (!serverRoutes.length) {
    log.warn(`server ${config.port} has no routes`)
  }

  if (!config.port || !Number.isInteger(config.port)) {
    let error = new Error(`no port defined for server, stopping setup early`)

    log.error(error, config)

    return ready(error)
  }

  serverRoutes.forEach(createRoute)

  // start our servers
  server.on('error', handleServerError(log, config))
  server.listen(config.port)
  enableDestroy(server)

  ready(
    errors.length ? errors : null,
    {
      server,
      handlers: boundHandlers,
      middlewares: boundMiddlewares,
      port: config.port
    }
  )

  log.info(`started server ${config.port}`)

  function createRoute (route) {
    const methods = arrayify(route.methods).map(m => m.toLowerCase())

    try {
      frock.handlers.register(route.handler)
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
        route.db ? frock.dbs.register(route.db) : null
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
      boundMiddlewares.push(middlewareProcessor)

      log.debug(`added route [${method}:${route.handler}] ${route.path}`)
    })
  }
}

// testing exports
createHttpServer._defaultRoute = defaultRoute
createHttpServer._onWhitelistFail = onWhitelistFail

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
