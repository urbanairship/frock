import bole from 'bole'
import {sync as resolve} from 'resolve'

export default createHandlerRegister

const log = bole('frock/register-handler')

function createHandlerRegister (pwd) {
  const handlers = new Map()

  handlers.register = register

  return handlers

  function register (name) {
    if (handlers.has(name)) {
      return handlers.get(name)
    }

    const handlerPath = resolve(name, {basedir: pwd})
    const handler = require(handlerPath)

    handlers.set(name, handler)

    log.debug(`registered handler ${name}`)

    return handler
  }
}
