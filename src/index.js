import http from 'http'
import path from 'path'
import EE from 'events'

import commuter from 'commuter'
import level from 'level'
import mkdirp from 'mkdirp'
import arrayify from 'arrify'
import {sync as resolve} from 'resolve'
import enableDestroy from 'server-destroy'
import bole from 'bole'

import addUtilMiddleware from './utils'

export default createFrockInstance

const log = bole('frock/index')

function createFrockInstance (config = {}, {pwd}) {
  const frock = new EE()
  const handlers = new Map()
  const servers = []
  const dbs = new Map()

  let dbPath

  frock.dbs = dbs
  frock.run = run
  frock.stop = stop
  frock.reload = reload
  frock.registerHandler = registerHandler

  // configure db if requested
  if (config.db) {
    // make our db directory, ok to throw
    mkdirp.sync(path.resolve(pwd, config.db.path))
    dbPath = path.resolve(pwd, config.db.path)
  }

  return frock

  function getOrCreateDb (_name) {
    if (!dbPath) {
      throw new Error(
        `A handler requested a database, but a database path wasn't specified.`
      )
    }

    const names = arrayify(_name)

    const retrieved = names.map(name => {
      if (dbs.has(name)) {
        return dbs.get(name)
      }

      const db = level(
        path.resolve(dbPath, name),
        {valueEncoding: 'json'}
      )

      dbs.set(name, db)

      return db
    })

    return retrieved.length > 1 ? retrieved : retrieved[0]
  }

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
          const logId = `${route.handler}:${serverConfig.port}>`
          const handler = handlers.get(route.handler)(
            frock,
            bole(logId),
            route.options,
            route.db ? getOrCreateDb(route.db) : null
          )

          router[method](
            route.path,
            addUtilMiddleware(
              bole(logId),
              handler
            )
          )
          boundHandlers.push(handler)

          log.debug(`added route [${method}:${route.handler}] ${route.path}`)
        })
      })

      servers.push({server, handlers: boundHandlers, port: serverConfig.port})
      server.listen(serverConfig.port, done)
      enableDestroy(server)

      log.info(`started server ${serverConfig.port}`)
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

    const handlerPath = resolve(name, {basedir: pwd})
    const handler = require(handlerPath)

    handlers.set(name, handler)

    log.debug(`registered handler ${name}`)
  }

  function reload (_config, ready = noop) {
    log.info('reloading')
    if (_config) {
      log.debug('replacing config', _config)
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
    log.info('### shutting down ###')
    let serverCount = 0

    servers.forEach(server => {
      let handlerCount = 0

      log.debug(`${server.port}: removing ${server.handlers.length} handlers`)
      server.handlers.forEach((handler, index) => {
        log.debug(`ending handler ${index}`)

        if (handler.end) {
          handler.end(innerDone)
        } else {
          log.error(`handler ${index} did not have a .end function`)
          innerDone()
        }

        function innerDone () {
          ++handlerCount

          log.debug(`handler ended ${index}`)

          if (handlerCount >= server.handlers.length) {
            log.debug(`no handlers remain, closing server ${server.port}`)
            server.handlers.splice(0, server.handlers.length)
            server.server.destroy(done)
          }
        }
      })

      function done () {
        ++serverCount

        log.debug(`server closed ${server.port}`)

        if (serverCount >= servers.length) {
          log.debug('servers stopped')
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

function noop () {
  // nooperations
}
