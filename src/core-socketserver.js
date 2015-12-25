/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const net = require('net')

const bole = require('bole')
const createDeter = require('deter')
const enableDestroy = require('server-destroy')

const {handleServerError} = require('./utils')

const log = bole('frock/core-socketsever')

module.exports = createSocketServer

function createSocketServer (frock, config, globalConfig, ready) {
  let constraints = config.connection || {}
  let handler
  let server

  if (!constraints.whitelist && !constraints.blacklist) {
    constraints = globalConfig.connection
  }

  const deter = createDeter(constraints, onSocketWhitelistFail)

  try {
    frock.handlers.register(config.handler)
  } catch (e) {
    log.error(`error registering socket handler ${config.handler}`, e)

    return ready(e)
  }

  const logId = `${config.handler}:${config.port}>`
  const handlerFn = frock.handlers.get(config.handler)

  if (!config.options) {
    config.options = {}
  }

  handler = handlerFn(
    frock,
    bole(logId),
    config.options,
    config.db ? frock.dbs.register(config.db) : null
  )

  server = net.createServer(config.port, deter(handler))

  log.debug(`added socket [${config.handler}]`)

  server.on('error', handleServerError(log, config))
  server.listen(config.port)
  enableDestroy(server)

  ready(null, {server, handlers: [handler], middlewares: [], port: config.port})

  log.info(`started server ${config.port}`)
}

// testing exports
createSocketServer._onSocketWhitelistFail = onSocketWhitelistFail

function onSocketWhitelistFail (client) {
  client.end()
  log.info('access socket from non-whitelisted, or from blacklisted address')
}
