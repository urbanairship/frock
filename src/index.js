import http from 'http'
import path from 'path'
import EE from 'events'

import commuter from 'commuter'
import createDeter from 'deter'
import level from 'level'
import mkdirp from 'mkdirp'
import arrayify from 'arrify'
import {sync as resolve} from 'resolve'
import enableDestroy from 'server-destroy'
import bole from 'bole'
import evidence from 'evidence'
import props from 'deep-property'

import addUtilMiddleware from './utils'

export default createFrockInstance

const DEFAULT_WHITELIST = ['127.0.0.1', '::1']

const log = bole('frock/index')

function createFrockInstance (_config = {}, {pwd}) {
  const frock = new EE()
  const handlers = new Map()
  const servers = []
  const dbs = new Map()
  const configStore = evidence()

  let globalConstraints = {}

  let dbPath

  frock.pwd = pwd
  frock.dbs = dbs
  frock.run = run
  frock.stop = stop
  frock.reload = reload
  frock.registerHandler = registerHandler
  frock.getOrCreateDb = getOrCreateDb

  configStore.write(_config)

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
    let config = configStore.get(0)
    let count = 0
    let errors = []

    const httpServers = config.servers || []

    globalConstraints = {
      whitelist: props.get(config, 'connection.whitelist'),
      blacklist: props.get(config, 'connection.blacklist')
    }

    // default to localhost only connections if not specified
    if (!globalConstraints.whitelist && !globalConstraints.blacklist) {
      globalConstraints.whitelist = DEFAULT_WHITELIST
    }

    // configure db if requested
    if (config.db) {
      // make our db directory, ok to throw
      mkdirp.sync(path.resolve(pwd, config.db.path))
      dbPath = path.resolve(pwd, config.db.path)
    }

    httpServers.forEach(serverConfig => {
      let constraints = serverConfig.connection || {}

      if (!constraints.whitelist && !constraints.blacklist) {
        constraints = globalConstraints
      }

      const deter = createDeter(constraints, onWhitelistFail)
      const router = commuter(defaultRoute, serverConfig.baseUrl)
      const server = http.createServer(deter(router))

      const serverRoutes = serverConfig.routes || []
      const boundHandlers = []

      // handle validation cases
      if (!serverRoutes.length) {
        log.warn(`server ${serverConfig.port} has no routes`)
      }

      if (!serverConfig.port || !Number.isInteger(serverConfig.port)) {
        log.error(
          `no port defined for server, stopping setup early`,
          serverConfig
        )

        return
      }

      serverRoutes.forEach(route => {
        const methods = arrayify(route.methods).map(m => m.toLowerCase())

        try {
          registerHandler(route.handler)
        } catch (e) {
          errors.push(e)
          log.error(`error registering handler ${route.handler}`, e)
        }

        methods.forEach(method => {
          const logId = `${route.handler}:${serverConfig.port}>`
          const handlerFn = handlers.get(route.handler)

          let handler

          if (!handlerFn) {
            let err = new Error(
              `${method} handler requested ${route.handler}, which wasn't available.`
            )

            log.error(err)
            errors.push(err)

            return
          }

          handler = handlerFn(
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

      // remember our servers, start them
      servers.push({server, handlers: boundHandlers, port: serverConfig.port})
      server.on('error', function (e) {
        if (e.code === 'EADDRINUSE') {
          log(`port ${serverConfig.port} could not be bound, address in use`)
        }
      })
      server.listen(serverConfig.port)
      enableDestroy(server)

      // call done() no matter what; we handle the error case above, but need
      // ensure we don't hang forever on a non-starting server
      done()

      log.info(`started server ${serverConfig.port}`)
    })

    function done () {
      ++count

      if (count >= httpServers.length) {
        frock.emit('run')
        ready(errors.length ? errors : null)
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

    if (typeof _config === 'object') {
      log.debug('replacing config', _config)
      configStore.write(_config)
    }

    stop(true, () => {
      run((err) => {
        frock.emit('reload')
        ready(err)
      })
    })
  }

  function stop (hot = false, ready = noop) {
    let serverCount = 0

    log.info('shutting down')

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

          ready()

          // if we're hot-reloading, we aren't actually stoping; don't emit
          if (!hot) {
            frock.emit('stop')
          }
        }
      }
    })
  }
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

function noop () {
  // nooperations
}
