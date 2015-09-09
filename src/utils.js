import bole from 'bole'

import createHandlerRegister from './register-handler'

export {processMiddleware, noopMiddleware}

const log = bole('frock/middleware')

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
}

function noopMiddleware (missingName) {
  return handler

  function handler (req, res, next) {
    log.error(`no-op middleware: ${missingName} was not found`)

    next(req, res)
  }
}
