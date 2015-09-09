import bole from 'bole'
import evidence from 'evidence'

export default createConfigRegister

const log = bole('frock/register-config')

const DEFAULT_WHITELIST = ['127.0.0.1', '::1']

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
  }
}
