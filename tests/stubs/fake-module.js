const {EventEmitter: EE} = require('events')

const through = require('through')

module.exports = fakeModule

function fakeModule (props = {}, methods = [], isStream = false) {
  const events = new EE()

  events.mock = mock

  return events

  function mock (...args) {
    const obj = Object.assign({}, props)
    const stream = through(write, end)

    methods.forEach(method => {
      obj[method] = (...args) => _emitNextTick(method, ...args)
    })

    _emitNextTick('instantiated', stream, ...args)

    obj.teardown = end

    return isStream ? Object.assign(stream, obj) : obj

    function write (...args) {
      _emitNextTick('written', stream, ...args)
    }

    function end (...args) {
      _emitNextTick('ended', stream, ...args)
    }
  }

  function _emitNextTick (...args) {
    process.nextTick(() => events.emit(...args))
  }
}
