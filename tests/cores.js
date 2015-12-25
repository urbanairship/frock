/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const test = require('tape')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')
const fakeFrock = require('./stubs/frock')

const bole = fakeModule()

const PKG_PATH = '/home/package.json'
const resolve = {
  sync: () => PKG_PATH
}

const lib = proxyquire(
  '../lib/cores.js',
  {
    'bole': bole.mock,
    'resolve': resolve,
    '@noCallThru': true
  }
)

test(`setup ${__filename}`, t => {
  t.plan(1)
  t.pass('set it up')
})

test('requires local package.json', t => {
  t.plan(2)

  const pwd = '/home'
  const pkg = {frock: {cores: []}}

  const cores = lib({pwd}, _require)

  t.deepEqual(cores, [])

  function _require (path) {
    t.equal(path, PKG_PATH)

    return pkg
  }
})

test('registers handlers', t => {
  t.plan(7)

  const pwd = '/home'
  const frock = fakeFrock(pwd)
  const pkg = {frock: {cores: [
    {
      handler: 'beep'
    },
    {
      handler: 'boop',
      db: 'boop-db'
    }
  ]}}

  frock.on('register-handlers', name => {
    if (name === 'beep') t.pass('beep registered')
    else if (name === 'boop') t.pass('boop registered')
    else t.fail(`unknown handler registered ${name}`)
  })

  frock.on('register-dbs', name => {
    if (name === 'boop-db') t.pass('registered boop db')
    else t.fail(`unknown db registered ${name}`)
  })

  frock.on('handler-beep', () => {
    t.pass('called beep handler')
  })

  frock.on('handler-boop', () => {
    t.pass('called boop handler')
  })

  const cores = lib(frock, () => {
    t.pass('called pkg require')

    return pkg
  })

  t.equal(cores.length, 2)
})

test(`teardown ${__filename}`, t => {
  t.plan(1)
  t.pass('tore it down')
})
