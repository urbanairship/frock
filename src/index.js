import http from 'http'

import commuter from 'commuter'
import arrayify from 'arrify'

export default createFrockInstance

const log = logger.bind(null, 'frock')

function createFrockInstance (config = {}) {
  const frock = {}
  const handlers = new Map()
  const servers = []

  frock.run = run
  frock.stop = stop
  frock.reload = reload
  frock.registerHandler = registerHandler

  return frock

  function run (ready = noop) {
    let count = 0

    config.servers.forEach(serverConfig => {
      const router = commuter(defaultRoute, serverConfig.baseUrl)
      const server = http.createServer(router)
      const boundHandlers = []

      serverConfig.routes.forEach(route => {
        const methods = arrayify(route.methods).map(m => m.toLowerCase())

        registerHandler(route.handler)

        methods.forEach(method => {
          const handler = handlers.get(route.handler)(
            frock,
            logger.bind(null, route.handler),
            route.options
          )

          router[method](route.path, handler)
          boundHandlers.push(handler)

          log('debug', `added route [${method}:${route.handler}] ${route.path}`)
        })
      })

      servers.push({server, handlers: boundHandlers})
      server.listen(serverConfig.port, done)

      log('info', `started server ${serverConfig.port}`)
    })

    function done () {
      ++count

      if (count >= config.servers.length) {
        ready()
      }
    }
  }

  function registerHandler (name) {
    if (handlers.has(name)) {
      return
    }

    const handler = require(name)

    handlers.set(name, handler)

    log('debug', `registered handler ${name}`)
  }

  function reload (ready = noop) {
    stop(() => run(ready))
  }

  function stop (ready = noop) {
    servers.forEach(s => {
      s.handlers.forEach(h => {
        h.end(innerDone)
      })

      function innerDone (handler) {
        const idx = s.handlers.indexOf(handler)

        if (idx) {
          s.handlers.splice(idx, 1)
        } else {
          throw new Error('No handler to remove, throwing to avoid infinite loop')
        }

        if (!s.handlers.length) {
          s.server.close(() => done(s))
        }
      }
    })

    function done (server) {
      const idx = servers.indexOf(server)

      if (idx) {
        servers.splice(idx, 1)
      } else {
        throw new Error('No server to remove, throwing to avoid infinite loop')
      }

      if (!servers.length) {
        ready()
      }
    }
  }
}

function defaultRoute (req, res) {
  res.statusCode = 404
  res.end('not found')
}

function logger (handler, level, msg, extra) {
  console.log(`${handler}: [${level.toUpperCase()}] ${msg}`)
}

function noop () {
  // nooperations
}
