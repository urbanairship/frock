/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const net = require('net')

const test = require('tape')
const portfinder = require('portfinder')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')
const fakeBole = fakeModule({}, ['debug', 'warn', 'error', 'info'])

const lib = proxyquire(
  '../lib/core-socketserver',
  {
    'bole': fakeBole.mock,
    '@noCallThru': true
  }
)

const {DEFAULT_WHITELIST} = require('../lib/register-config')
const globalConfig = {connection: {whitelist: DEFAULT_WHITELIST}}

let testPort

test(`setup ${__filename}`, t => {
  t.plan(1)

  portfinder.getPort((err, port) => {
    if (err) {
      throw err
    }

    testPort = port
    t.pass('set it up')
  })
})

test('successfully starts socket server', t => {
  t.plan(5)

  const frock = {
    handlers: {
      register: () => {},
      get: () => handler
    }
  }

  lib(frock, {port: testPort}, globalConfig, (err, {server, port}) => {
    if (err) {
      t.fail('failed to start server!', err)

      return
    }

    t.equal(testPort, port)

    const client = net.createConnection(port, () => {
      client.write(new Buffer('beep'))
    })

    client.on('end', () => {
      server.destroy(() => t.pass('server destroyed'))
    })
  })

  function handler (frk, log, opts) {
    /* eslint-disable eqeqeq */
    t.true(frk == frock, 'passes through unmodified frock')
    /* eslint-enable eqeqeq */

    return function (client) {
      t.pass('client connected')
      client.on('data', buf => {
        t.equal(buf.toString(), 'beep', 'got data from client')
        client.end()
      })
    }
  }
})

test('rejects non-whitelist clients', t => {
  t.plan(3)

  const frock = {
    handlers: {
      register: () => {},
      get: () => handler
    }
  }

  lib(frock, {port: testPort}, {connection: {whitelist: []}}, (err, {server, port}) => {
    if (err) {
      t.fail('failed to start server!', err)

      return
    }

    t.equal(testPort, port)

    const client = net.createConnection(port)

    client.on('end', () => {
      t.pass('was killed')
      server.destroy(() => t.pass('server destroyed'))
    })
  })

  function handler (frk, log, opts) {
    return function (client) {
      t.fail('client should not connect')
    }
  }
})

test(`teardown ${__filename}`, t => {
  t.plan(1)
  t.pass('tore it down')
})
