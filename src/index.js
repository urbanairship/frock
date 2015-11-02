require('babel-polyfill')

const {EventEmitter} = require('events')

const commuter = require('commuter')
const arrayify = require('arrify')
const bole = require('bole')

const createCores = require('./cores')
const createSocketServer = require('./core-socketserver')
const createHttpServer = require('./core-httpserver')
const createHandlerRegister = require('./register-handler')
const createDbRegister = require('./register-db')
const createConfigRegister = require('./register-config')
const pkg = require('../package.json')

const log = bole('frock/index')

module.exports = createFrockInstance

function createFrockInstance (_config = {}, {pwd}) {
  const frock = new EventEmitter()
  const handlers = createHandlerRegister(pwd)
  const servers = []
  const dbs = createDbRegister(pwd)
  const configs = createConfigRegister()

  let firstRun = true

  frock.pwd = pwd
  frock.version = pkg.version

  frock.run = run
  frock.stop = stop
  frock.reload = reload

  frock.dbs = dbs
  frock.handlers = handlers

  frock.logger = bole
  frock.router = commuter

  configs.register(_config)

  return frock

  function run (ready = noop) {
    let config = configs.get(0)
    let count = 0
    let errors = []

    const httpServers = config.servers || []
    const socketServers = config.sockets || []

    // perform first-run only tasks
    if (firstRun) {
      firstRun = false

      createCores(frock)
    }

    // configure db if requested
    if (config.db) {
      dbs._updatePath(config.db.path)
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

  function reload (_config, ready = noop) {
    log.info('reloading')

    if (_config && typeof _config === 'object') {
      log.debug('replacing config', _config)
      configs.register(_config)
    } else if (_config && typeof _config === 'function') {
      // support passing ready as the first param
      ready = _config
    }

    stop(true, () => {
      run((err) => {
        frock.emit('reload')
        ready(err)
      })
    })
  }

  function stop (hot = false, ready = noop) {
    // support passing ready as the first param
    if (typeof hot === 'function') {
      ready = hot
      hot = false
    }

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

            // destroy all middlewares
            if (server.middlewares && server.middlewares.length) {
              server.middlewares.forEach(middleware => middleware.end())
              server.middlewares.splice(0, server.middlewares.length)
            }

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
