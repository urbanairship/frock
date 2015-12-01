const bole = require('bole')
const {sync: resolve} = require('resolve')
const semver = require('semver')
const {extensions} = require('interpret')
const rechoir = require('rechoir')

const pkg = require('../package.json')

const log = bole('frock/register-handler')

module.exports = createHandlerRegister

function createHandlerRegister (pwd, _require = require) {
  const handlers = new Map()
  const paths = new Map()

  handlers.register = register
  handlers.destroy = destroy

  return handlers

  function register (name) {
    if (handlers.has(name)) {
      return handlers.get(name)
    }

    const handlerPath = resolve(name, {basedir: pwd})

    try {
      rechoir.prepare(extensions, handlerPath)
    } catch (e) {
      // pass, but log the error
      log.error(`Error preparing transform for ${name}\n  ${e.message}`)
    }

    const handler = _require(handlerPath)

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
        lpkg = _require(pkgPath)
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
          `handler ${name} did not specify its compatible frock versions!`
        )
      }
    }

    log.debug(`registered handler ${name}`)

    return handler
  }

  function destroy () {
    log.debug(`unloading all required handlers`)

    for (let val of paths.values()) {
      delete _require.cache[val]
    }

    handlers.clear()
    paths.clear()
  }
}
