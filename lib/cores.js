/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const bole = require('bole')
const {sync: resolve} = require('resolve')

const log = bole('frock/cores')

module.exports = createCores

function createCores (frock, _require = require) {
  let localPkg = {}

  try {
    localPkg = _require(resolve('./package.json', {basedir: frock.pwd}))
  } catch (e) {
    log.debug('could not locate a project-local package.json')
  }

  const cores = localPkg.frock && localPkg.frock.cores || []

  return cores.map(createCore)

  function createCore (config) {
    const logId = `core::${config.handler}>`

    let handler
    let handlerFn

    try {
      frock.handlers.register(config.handler)
    } catch (e) {
      log.error(`error registering core ${config.handler}`, e)

      return
    }

    handlerFn = frock.handlers.get(config.handler)

    if (!config.options) {
      config.options = {}
    }

    handler = handlerFn(
      frock,
      bole(logId),
      config.options,
      config.db ? frock.dbs.register(config.db) : null
    )

    return handler
  }
}
