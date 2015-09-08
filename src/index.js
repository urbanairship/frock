import path from 'path'
import EE from 'events'

import commuter from 'commuter'
import level from 'level'
import mkdirp from 'mkdirp'
import arrayify from 'arrify'
import {sync as resolve} from 'resolve'
import bole from 'bole'
import evidence from 'evidence'

import createSocketServer from './core-socketserver'
import createHttpServer from './core-httpserver'
import pkg from '../package.json'

export default createFrockInstance

const DEFAULT_WHITELIST = ['127.0.0.1', '::1']

const log = bole('frock/index')

function createFrockInstance (_config = {}, {pwd}) {
  const frock = new EE()
  const handlers = new Map()
  const servers = []
  const dbs = new Map()
  const configStore = evidence()

  let dbPath

  frock.pwd = pwd
  frock.dbs = dbs
  frock.version = pkg.version

  frock.run = run
  frock.stop = stop
  frock.reload = reload

  frock.handlers = handlers
  frock.router = commuter
  frock.registerHandler = registerHandler
  frock.getOrCreateDb = getOrCreateDb

  writeConfig(_config)

  return frock

  function writeConfig (cfg) {
    if (!cfg.connection) {
      cfg.connection = {}
    }

    const {whitelist, blacklist} = cfg.connection

    // default to localhost only connections if not specified
    if (!whitelist && !blacklist) {
      cfg.connection.whitelist = DEFAULT_WHITELIST
    }

    configStore.write(cfg)
  }

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
    const socketServers = config.sockets || []

    // configure db if requested
    if (config.db) {
      // make our db directory, ok to throw
      mkdirp.sync(path.resolve(pwd, config.db.path))
      dbPath = path.resolve(pwd, config.db.path)
    }

    socketServers.forEach(socketConfig => {
      createSocketServer(frock, socketConfig, config, done)
    })

    httpServers.forEach(serverConfig => {
      createHttpServer(frock, serverConfig, config, done)
    })

    function done (errs, server) {
      ++count

      if (errs) {
        errors.push.apply(errors, arrayify(errs))
      } else if (server) {
        servers.push(server)
      }

      if (count >= httpServers.length + socketServers.length) {
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
      writeConfig(_config)
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
    })

    function done () {
      ++serverCount

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
  }
}

function noop () {
  // nooperations
}
