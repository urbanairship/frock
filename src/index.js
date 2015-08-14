import http from 'http'

import commuter from 'commuter'
import arrayify from 'arrify'

export default createFrockInstance

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

    config.servers.forEach(s => {
      const router = commuter(defaultRoute, s.baseUrl)
      const server = http.createServer(router)
      const boundHandlers = []

      s.routes.forEach(r => {
        const methods = arrayify(r.methods).map(m => m.toLowerCase())

        methods.forEach(m => {
          const handler = handlers.get(r.handler)(
            frock,
            logger.bind(null, r.handler),
            r.options
          )

          router[m](r.path, handler)
          boundHandlers.push(handler)
        })
      })

      servers.push({server, handlers: boundHandlers})
      server.listen(s.port, done)
    })

    function done () {
      ++count

      if (count >= config.servers.length) {
        ready()
      }
    }
  }

  function registerHandler (name, handler) {
    handlers.set(name, handler)
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
