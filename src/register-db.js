const path = require('path')

const bole = require('bole')
const {sync: mkdirp} = require('mkdirp')
const {sync: resolve} = require('resolve')

const log = bole('frock/register-db')

module.exports = createDbRegister

function createDbRegister (pwd, _path, _require = require) {
  const level = loadCompatibleDb()
  const dbs = new Map()

  let dbPath = _path

  dbs.register = register
  dbs._updatePath = updatePath

  return dbs

  function register (name) {
    if (!level) {
      throw new Error(
        `A handler requested a database, but you don't have a local database\n` +
          `installed; please see the documentation for further information.`
      )
    } else if (!dbPath) {
      throw new Error(
        `A handler requested a database, but a database path wasn't specified.`
      )
    }

    if (dbs.has(name)) {
      return dbs.get(name)
    }

    const db = level(
      path.resolve(dbPath, name),
      {valueEncoding: 'json'}
    )

    dbs.set(name, db)

    log.debug(`registered db ${name}`)

    return db
  }

  function updatePath (_path) {
    const newPath = path.resolve(pwd, _path)

    // don't update if identical
    if (newPath === dbPath) {
      return
    }

    log.debug(`updating db path to ${newPath}`)

    // make our db directory, ok to throw
    mkdirp(newPath)
    dbPath = newPath

    // clear our saved dbs if we're changing paths
    dbs.clear()
  }

  function loadCompatibleDb () {
    const compatibleDbPkgs = ['level', 'levelup']

    for (let i = 0; i < compatibleDbPkgs.length; ++i) {
      let db = tryRequire(compatibleDbPkgs[i])

      if (db) {
        return db
      }
    }
  }

  function tryRequire (pkg) {
    let required

    try {
      required = _require(resolve(pkg, {basedir: pwd}))
    } catch (e) {
      // pass
    }

    return required
  }
}
