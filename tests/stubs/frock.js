const {EventEmitter: EE} = require('events')

const pkg = require('../../package.json')

module.exports = createFakeFrock

function createFakeFrock (pwd = '/home/default') {
  const frock = new EE()
  const props = {
    pwd,
    version: pkg.version,
    dbs: createFakeRegister('dbs'),
    handlers: createFakeRegister('handlers')
  }

  const methods = ['run', 'stop', 'reload']

  methods.forEach(method => {
    frock[method] = (...args) => _emitNextTick(method, frock, ...args)
  })

  return Object.assign(frock, props)

  function _emitNextTick (...args) {
    process.nextTick(() => frock.emit(...args))
  }

  function createFakeRegister (name) {
    return {
      register: (...args) => _emitNextTick(`register-${name}`, ...args),
      get: (...args) => {
        _emitNextTick(`get-${name}`, ...args)
        return (...inner) => _emitNextTick(`handler-${args[0]}`, ...inner)
      }
    }
  }
}
