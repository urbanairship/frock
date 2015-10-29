import bole from 'bole'
import {sync as resolve} from 'resolve'
import semver from 'semver'

import pkg from '../package.json'

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

    // only perform package version checks for installable mocks
    if (handlerPath.includes('node_modules')) {
      let pkgPath
      let lpkg

      try {
        pkgPath = resolve(
          name.replace(/\/$/, '') + '/package.json',
          {basedir: pwd}
        )
        lpkg = require(pkgPath)
      } catch (e) {
        log.debug(`unable to require path ${e.message}`)
      }

      if (lpkg && lpkg.frock && lpkg.frock['compatible-versions']) {
        const compat = lpkg.frock['compatible-versions']

        if (!semver.satisfies(pkg.version, compat)) {
          log.warn(
            `handler ${name} claims compatibility with ${compat}, but you ` +
            `are using frock version ${pkg.version}. You may experience ` +
            `unexpected behavior.`
          )
        }
      } else {
        log.warn(
          `handler ${name} did not specify it's compabile frock versions!`
        )
      }
    }

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
