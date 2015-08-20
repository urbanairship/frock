import http from 'http'
import path from 'path'
import EE from 'events'

import commuter from 'commuter'
import level from 'level'
import mkdirp from 'mkdirp'
import arrayify from 'arrify'
import enableDestroy from 'server-destroy'

import addUtils from './utils'

export default createFrockInstance

const log = logger.bind(null, 'frock')

function createFrockInstance (config = {}, {pwd}) {
  const frock = new EE()
  const handlers = new Map()
  const servers = []

  frock.run = run
  frock.stop = stop
  frock.reload = reload
  frock.registerHandler = registerHandler

  // load db if requested
  if (config.db) {
    // make our db directory, ok to throw
    mkdirp.sync(path.resolve(pwd, config.db.path))
    frock.db = level(
      path.resolve(pwd, config.db.path, config.db.name),
      {valueEncoding: 'json'}
    )
  }

  return frock

  function run (ready = noop) {
    let count = 0

    config.servers.forEach(serverConfig => {
      const router = commuter(defaultRoute, serverConfig.baseUrl)
      const server = http.createServer(addUtils(logger.bind(null, 'middleware'), router))
      const boundHandlers = []

      serverConfig.routes.forEach(route => {
        const methods = arrayify(route.methods).map(m => m.toLowerCase())

        registerHandler(route.handler)

        methods.forEach(method => {
          const handler = handlers.get(route.handler)(
            frock,
            logger.bind(null, `${route.handler}:${serverConfig.port}>`),
            route.options
          )

          router[method](route.path, handler)
          boundHandlers.push(handler)

          log('debug', `added route [${method}:${route.handler}] ${route.path}`)
        })
      })

      servers.push({server, handlers: boundHandlers, port: serverConfig.port})
      server.listen(serverConfig.port, done)
      enableDestroy(server)

      log('info', `started server ${serverConfig.port}`)
    })

    function done () {
      ++count

      if (count >= config.servers.length) {
        frock.emit('run')
        ready()
      }
    }
  }

  function registerHandler (name) {
    if (handlers.has(name)) {
      return
    }

    const handler = require(path.join(pwd, 'node_modules', name))

    handlers.set(name, handler)

    log('debug', `registered handler ${name}`)
  }

  function reload (_config, ready = noop) {
    log('info', 'reloading')
    if (_config) {
      log('debug', 'replacing config', _config)
      config = _config
    }

    stop(true, () => {
      run(() => {
        frock.emit('reload')
        ready()
      })
    })
  }

  function stop (hot = false, ready = noop) {
    log('info', '### shutting down ###')
    let serverCount = 0

    servers.forEach(server => {
      let handlerCount = 0

      log('debug', `${server.port}: removing ${server.handlers.length} handlers`)
      server.handlers.forEach((handler, index) => {
        log('debug', `ending handler ${index}`)
        handler.end(innerDone)

        function innerDone () {
          ++handlerCount

          log('debug', `handler ended ${index}`)

          if (handlerCount >= server.handlers.length) {
            log('debug', `no handlers remain, closing server ${server.port}`)
            server.handlers.splice(0, server.handlers.length)
            server.server.destroy(done)
          }
        }
      })

      function done () {
        ++serverCount

        log('debug', `server closed ${server.port}`)

        if (serverCount >= servers.length) {
          log('debug', 'servers stopped')
          servers.splice(0, servers.length)

          // if we're hot-reloading, we aren't actually stoping; don't emit
          if (!hot) {
            frock.emit('stop')
          }

          ready()
        }
      }
    })
  }
}

function defaultRoute (req, res) {
  res.statusCode = 404
  res.end('not found')
}

function logger (handler, level, msg, extra) {
  console.log(`${handler} [${level.toUpperCase()}] ${msg}`)
}

function noop () {
  // nooperations
}
