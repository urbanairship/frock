/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const test = require('tape')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')
const fakeBole = fakeModule({}, ['debug', 'warn', 'error', 'info'])

const {dup} = require('../lib/utils')

const resolve = {
  sync: (name) => `/home/${name}`
}

const rechoir = {
  prepare: () => true
}

const FROCK_VERSION = '0.1.1'

const lib = proxyquire(
  '../lib/register-handler',
  {
    'resolve': resolve,
    'bole': fakeBole.mock,
    'rechoir': rechoir,
    '../package.json': {version: FROCK_VERSION},
    '@noCallThru': true
  }
)

test(`setup ${__filename}`, t => {
  t.plan(1)

  t.pass('set it up')
})

test('registers named handler', t => {
  t.plan(3)

  const pkg = {isAPackage: true}
  const name = 'some-package'

  const instance = lib('', _require)

  const handler = instance.register(name)

  t.deepEqual(handler, pkg, 'package successfully registered')
  t.deepEqual(instance.get(name), pkg, 'can retrieve required pkg')

  function _require (path) {
    t.equal(path, `/home/${name}`, 'require called with correct package')

    return dup(pkg)
  }
})

test('registers multiple handlers', t => {
  t.plan(4)

  const pkg = {isAPackage: true}
  const pkg2 = {isAPackage: 'absolutely'}
  const name = 'some-package'
  const name2 = 'some-other-package'

  const instance = lib('', _require)

  const handler = instance.register(name)
  const handler2 = instance.register(name2)

  t.deepEqual(handler, pkg, 'package successfully registered')
  t.deepEqual(instance.get(name), pkg, 'can retrieve required pkg')

  t.deepEqual(handler2, pkg2, 'package successfully registered')
  t.deepEqual(instance.get(name2), pkg2, 'can retrieve required pkg')

  function _require (path) {
    if (path.includes(name)) return dup(pkg)
    else if (path.includes(name2)) return dup(pkg2)

    t.fail('got unexpected path name')
  }
})

test('can destroy registry', t => {
  t.plan(7)

  const pkg = {isAPackage: true}
  const pkg2 = {isAPackage: 'absolutely'}
  const name = 'some-package'
  const name2 = 'some-other-package'

  const _require = (path) => {
    let retValue

    if (path.includes(name)) retValue = dup(pkg)
    else if (path.includes(name2)) retValue = dup(pkg2)

    _require.cache[path] = 'cached'

    return retValue
  }

  _require.cache = {}

  const instance = lib('', _require)

  const handler = instance.register(name)
  const handler2 = instance.register(name2)

  t.deepEqual(handler, pkg, 'package successfully registered')
  t.deepEqual(instance.get(name), pkg, 'can retrieve required pkg')

  t.deepEqual(handler2, pkg2, 'package successfully registered')
  t.deepEqual(instance.get(name2), pkg2, 'can retrieve required pkg')

  t.equal(Object.keys(_require.cache).length, 2)

  instance.destroy()

  t.equal(Object.keys(_require.cache).length, 0)

  t.notOk(instance.get(name))
})

test('checks version on modules', t => {
  t.plan(4)

  const pkg = {isAPackage: true}
  /* Normally the `node_modules` fragment would come from the resolve, not the
   * require, but we mangle it a bit here so we don't have to have some complex
   * proxyquire'd mock for the resolve function
   */
  const name = 'node_modules/some-package'

  const instance = lib('', _require)

  const handler = instance.register(name)

  t.deepEqual(handler, pkg, 'package successfully registered')
  t.deepEqual(instance.get(name), pkg, 'can retrieve required pkg')

  function _require (path) {
    if (path.includes('package.json')) {
      t.pass(`required module's package`)

      return {frock: {'compatible-versions': '0.1 - 0.9.*'}}
    }

    t.equal(path, `/home/${name}`, 'require called with correct package')

    return dup(pkg)
  }
})

test('logs warning on incompatible versions', t => {
  t.plan(5)

  const pkg = {isAPackage: true}
  /* Normally the `node_modules` fragment would come from the resolve, not the
   * require, but we mangle it a bit here so we don't have to have some complex
   * proxyquire'd mock for the resolve function
   */
  const name = 'node_modules/some-package'

  const instance = lib('', _require)

  fakeBole.on('warn', msg => t.ok(msg.includes(FROCK_VERSION), 'logged warn'))

  const handler = instance.register(name)

  t.deepEqual(handler, pkg, 'package successfully registered')
  t.deepEqual(instance.get(name), pkg, 'can retrieve required pkg')

  function _require (path) {
    if (path.includes('package.json')) {
      t.pass(`required module's package`)

      return {frock: {'compatible-versions': '^1.0.0'}}
    }

    t.equal(path, `/home/${name}`, 'require called with correct package')

    return dup(pkg)
  }
})

test('re-register returns existing handler', t => {
  t.plan(4)

  const pkg = {isAPackage: true}
  const name = 'some-package'

  const instance = lib('', _require)

  let registerCount = 0

  const handler = instance.register(name)

  t.deepEqual(handler, pkg, 'package successfully registered')
  t.deepEqual(instance.get(name), pkg, 'can retrieve required pkg')

  const reregister = instance.register(name)

  t.equal(reregister, handler, 'returns the same object')

  function _require (path) {
    if (!registerCount) {
      registerCount++
      t.pass('called once')

      return dup(pkg)
    }

    t.fail('called require twice')
  }
})

test(`teardown ${__filename}`, t => {
  t.plan(1)

  t.pass('tore it down')
})
