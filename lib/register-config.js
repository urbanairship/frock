/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const bole = require('bole')
const evidence = require('evidence')

const {dup} = require('./utils')

const log = bole('frock/register-config')
const DEFAULT_WHITELIST = ['127.0.0.1', '::1']

module.exports = createConfigRegister
module.exports.DEFAULT_WHITELIST = DEFAULT_WHITELIST

function createConfigRegister () {
  const configStore = evidence()

  configStore.on('data', () => log.debug('using new configuration'))

  return {
    register,
    get: configStore.get
  }

  function register (_config) {
    if (!_config.connection) {
      _config.connection = {}
    }

    const {whitelist, blacklist} = _config.connection

    // default to localhost only connections if not specified
    if (!whitelist && !blacklist) {
      log.debug('using default whitelist')

      _config.connection.whitelist = DEFAULT_WHITELIST
    }

    configStore.write(_config)

    return dup(_config)
  }
}
