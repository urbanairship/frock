import {sync as resolve} from 'resolve'
import bole from 'bole'

export {processMiddleware}

const log = bole('frock/middleware')

function processMiddleware (frock, logger, options = {}, middlewares = [], route) {
  const handlers = new Map()

  let toInit = middlewares.map(middleware => {
    if (typeof middleware.handler === 'function') {
      log.debug(`initializing non-required middleware`)
      return middleware.handler(frock, logger, middleware.options)
    }

    log.debug(`initializing middleware ${middleware.handler}`)

    try {
      registerMiddleware(middleware.handler)
    } catch (e) {
      log.error(`Error registering middleware ${e.toString()}`, middleware)

      return
    }

    return handlers.get(middleware.handler)(frock, logger, middleware.options)
  })

  toInit = toInit.filter(Boolean)

  return handleRequest

  function handleRequest (req, res) {
    mw(0, req, res)

    function mw (idx, rq, rs) {
      if (idx >= toInit.length) {
        return route(req, res)
      }

      toInit[idx](req, res, mw.bind(null, ++idx))
    }
  }

  function registerMiddleware (name) {
    if (handlers.has(name)) {
      return
    }

    const handlerPath = resolve(name, {basedir: frock.pwd})
    const handler = require(handlerPath)

    handlers.set(name, handler)

    log.debug(`registered middleware handler ${name}`)
  }
}
