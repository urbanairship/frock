const bole = require('bole')

const createHandlerRegister = require('./register-handler')

const log = bole('frock/middleware')

module.exports = {processMiddleware, noopMiddleware, handleServerError, dup}

function processMiddleware (frock, logger, options = {}, middlewares = [], route) {
  const handlers = createHandlerRegister(frock.pwd)

  let middlewareStack = middlewares.map(middleware => {
    if (typeof middleware.handler === 'function') {
      log.debug(`initializing non-required middleware`)
      return middleware.handler(frock, logger, middleware.options)
    }

    log.debug(`initializing middleware ${middleware.handler}`)

    let handler

    try {
      handler = handlers.register(middleware.handler)
    } catch (e) {
      log.error(`Error registering middleware ${e.toString()}`, middleware)

      return noopMiddleware(middleware.handler)
    }

    return handler(frock, logger, middleware.options)
  })

  handleRequest.end = end

  return handleRequest

  function handleRequest (req, res) {
    mw(0, req, res)

    function mw (idx, rq, rs) {
      if (idx >= middlewareStack.length) {
        return route(req, res)
      }

      middlewareStack[idx](req, res, mw.bind(null, ++idx))
    }
  }

  function end () {
    handlers.destroy()
  }
}

function noopMiddleware (missingName) {
  return handler

  function handler (req, res, next) {
    log.error(`no-op middleware: ${missingName} was not found`)

    next(req, res)
  }
}

function handleServerError (logger, config) {
  return onError

  function onError (err) {
    if (err.code === 'EADDRINUSE') {
      logger.error(`port ${config.port} could not be bound, address in use`)

      return
    }

    logger.error(
      `server running on ${config.port} encountered an error: ${err}--` +
      `it's recommended that you restart frock`
    )
  }
}

function dup (obj) {
  return JSON.parse(JSON.stringify(obj))
}
