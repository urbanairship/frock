import bole from 'bole'
import {sync as resolve} from 'resolve'

export default createHandlerRegister

const log = bole('frock/register-handler')

function createHandlerRegister (pwd) {
  const handlers = new Map()
  const paths = new Map()

  handlers.register = register
  handlers.destroy = destroy

  return handlers

  function register (name) {
    const handlerPath = resolve(name, {basedir: pwd})
    const handler = require(handlerPath)

    if (handlers.has(name)) {
      return handlers.get(name)
    }

    handlers.set(name, handler)
    paths.set(name, handlerPath)

    log.debug(`registered handler ${name}`)

    return handler
  }

  function destroy () {
    log.debug(`unloading all required handlers`)

    for (let val of paths.values()) {
      delete require.cache[val]
    }

    handlers.clear()
    paths.clear()
  }
}
