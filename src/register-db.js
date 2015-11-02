const path = require('path')

const level = require('level')
const bole = require('bole')
const {sync: mkdirp} = require('mkdirp')

const log = bole('frock/register-db')

module.exports = createDbRegister

function createDbRegister (pwd, _path) {
  const dbs = new Map()

  let dbPath = _path

  dbs.register = register
  dbs._updatePath = updatePath

  return dbs

  function register (name) {
    if (!dbPath) {
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
}
