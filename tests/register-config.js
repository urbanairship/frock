/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const test = require('tape')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')
const fakeBole = fakeModule({}, ['debug', 'warn', 'error', 'info'])

const lib = proxyquire(
  '../lib/register-config',
  {
    'bole': fakeBole.mock,
    '@noCallThru': true
  }
)

test(`setup ${__filename}`, t => {
  t.plan(1)

  t.pass('set it up')
})

test('registers new config', t => {
  t.plan(2)

  const instance = lib()
  const config = {
    connection: {
      whitelist: ['whatever']
    },
    item: ['something']
  }
  const written = instance.register(config)

  /* eslint-disable eqeqeq */
  t.ok(config != written, 'should return a duplicated object')
  /* eslint-enable eqeqeq */
  t.deepEqual(written, instance.get(), 'can retrieve current config')
})

test('adds default whitelist when not present', t => {
  t.plan(1)

  const instance = lib()
  const config = {
    item: ['something']
  }
  const expected = {
    connection: {
      whitelist: lib.DEFAULT_WHITELIST
    },
    item: ['something']
  }
  const written = instance.register(config)

  t.deepEqual(written, expected, 'whitelist added')
})

test(`teardown ${__filename}`, t => {
  t.plan(1)

  t.pass('tore it down')
})
