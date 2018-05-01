/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const test = require('tape')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')
const fakeBole = fakeModule({}, ['debug', 'warn', 'error', 'info'])

const resolve = {
  sync: (name) => `/home/${name}`
}

const mkdirp = {
  sync: () => {}
}

const path = {
  resolve: (loc, name) => `/${loc}/${name}`
}

const lib = proxyquire(
  '../lib/register-db',
  {
    'resolve': resolve,
    'path': path,
    'mkdirp': mkdirp,
    'bole': fakeBole.mock,
    '@noCallThru': true
  }
)

test(`setup ${__filename}`, t => {
  t.plan(1)

  t.pass('set it up')
})

test('registers named db', t => {
  t.plan(4)

  const name = 'some-db'
  const instance = lib('', 'wherever', _require)

  const db = instance.register(name)

  t.equal(db, 'success', 'db successfully registered')
  t.equal(instance.get(name), 'success', 'can retrieve db later')

  function _require (path) {
    t.equal(path, `/home/level`, 'require called with correct path')

    return function register (registeredName) {
      t.deepEqual(registeredName, `/wherever/${name}`)

      return 'success'
    }
  }
})

test('re-register returns existing db', t => {
  t.plan(5)

  const name = 'some-db'
  const instance = lib('', 'wherever', _require)

  const db = instance.register(name)

  t.equal(db, 'success', 'db successfully registered')
  t.equal(instance.get(name), 'success', 'can retrieve db later')

  const db2 = instance.register(name)

  t.equal(db2, 'success', 'db successfully registered')

  function _require (path) {
    t.equal(path, `/home/level`, 'require called with correct path')

    let count = 0

    return (registeredName) => {
      if (!count) {
        t.deepEqual(registeredName, `/wherever/${name}`)
        ++count

        return 'success'
      }

      t.fail('should not get called twice')
    }
  }
})

test('updating path clears db list', t => {
  t.plan(6)

  const name = 'some-db'
  const instance = lib('', 'wherever', _require)

  const db = instance.register(name)

  t.equal(db, 'success', 'db successfully registered')
  t.equal(instance.get(name), 'success', 'can retrieve db later')

  instance._updatePath('new')

  const db2 = instance.register(name)

  t.equal(db2, 'second', 'new db path successfully registered')

  function _require (path) {
    t.equal(path, `/home/level`, 'require called with correct path')

    let count = 0

    return (registeredName) => {
      if (!count) {
        t.deepEqual(registeredName, `/wherever/${name}`)
        ++count

        return 'success'
      }

      t.ok(registeredName.includes(`/new/${name}`))

      return 'second'
    }
  }
})

test(`teardown ${__filename}`, t => {
  t.plan(1)

  t.pass('tore it down')
})
