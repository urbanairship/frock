/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const http = require('http')

const test = require('tape')
const portfinder = require('portfinder')
const proxyquire = require('proxyquire')
const commuter = require('commuter')

const fakeModule = require('./stubs/fake-module')
const fakeBole = fakeModule({}, ['debug', 'warn', 'error', 'info'])

const lib = proxyquire(
  '../lib/core-httpserver',
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

test('successfully starts http server', t => {
  t.plan(5)

  const frock = {
    handlers: {
      register: () => {},
      get: () => handler
    },
    router: commuter
  }

  const config = {
    port: testPort,
    routes: [
      {
        path: '*',
        methods: 'any',
        handler: 'doesntmatterlol'
      }
    ]
  }

  lib(frock, config, globalConfig, (err, {server, port}) => {
    if (err) {
      t.fail('failed to start server!', err)

      return
    }

    t.equal(testPort, port)

    const req = http.request({port}, res => {
      res.on('data', buf => {
        t.equal(buf.toString(), 'boop', 'got data from server')
      })
      res.on('end', () => {
        server.destroy(() => t.pass('server destroyed'))
      })
    })

    req.on('error', err => {
      t.fail(err.message)
    })

    req.end()
  })

  function handler (frk, log, opts) {
    /* eslint-disable eqeqeq */
    t.true(frk == frock, 'passes through unmodified frock')
    /* eslint-enable eqeqeq */

    return function (req, res) {
      t.pass('client connected')
      res.end(new Buffer('boop'))
    }
  }
})

test('adds default middleware to handler', t => {
  t.plan(4)

  const frock = {
    handlers: {
      register: () => {},
      get: () => handler
    },
    router: commuter
  }
  const config = {
    port: testPort,
    routes: [
      {
        path: '*',
        methods: 'any',
        handler: 'doesntmatterlol'
      }
    ]
  }
  const expected = {beep: 'boop'}

  lib(frock, config, globalConfig, (err, {server, port}) => {
    if (err) {
      t.fail('failed to start server!', err)

      return
    }

    t.equal(testPort, port)

    const req = http.request({port}, res => {
      res.on('data', buf => {
        t.deepEqual(JSON.parse(buf.toString()), expected)
      })
      res.on('end', () => {
        server.destroy(() => t.pass('server destroyed'))
      })
    })

    req.on('error', err => {
      t.fail(err.message)
    })

    req.end()
  })

  function handler (frk, log, opts) {
    /* eslint-disable eqeqeq */
    t.true(frk == frock, 'passes through unmodified frock')
    /* eslint-enable eqeqeq */

    return function (req, res) {
      res.json(expected)
    }
  }
})

test('can add per-server middlewares', t => {
  t.plan(5)

  const frock = {
    handlers: {
      register: () => {},
      get: () => handler
    },
    router: commuter
  }
  const config = {
    port: testPort,
    routes: [
      {
        path: '*',
        methods: 'any',
        handler: 'doesntmatterlol'
      }
    ],
    middleware: [{handler: middleware}]
  }
  const expected = {beep: 'boop'}

  lib(frock, config, globalConfig, (err, {server, port}) => {
    if (err) {
      t.fail('failed to start server!', err)

      return
    }

    t.equal(testPort, port)

    const req = http.request({port}, res => {
      res.on('data', buf => {
        t.deepEqual(JSON.parse(buf.toString()), expected)
      })
      res.on('end', () => {
        server.destroy(() => t.pass('server destroyed'))
      })
    })

    req.on('error', err => {
      t.fail(err.message)
    })

    req.end()
  })

  function handler (frk, log, opts) {
    /* eslint-disable eqeqeq */
    t.true(frk == frock, 'passes through unmodified frock')
    /* eslint-enable eqeqeq */

    return function (req, res) {
      res.json(expected)
    }
  }

  function middleware (frk, log, opts) {
    return function (req, res, next) {
      t.pass('processed middleware')
      next(req, res)
    }
  }
})

test('can add per-route middlewares', t => {
  t.plan(5)

  const frock = {
    handlers: {
      register: () => {},
      get: () => handler
    },
    router: commuter
  }
  const config = {
    port: testPort,
    routes: [
      {
        path: '*',
        methods: 'any',
        handler: 'doesntmatterlol',
        middleware: [{handler: middleware}]
      }
    ]
  }
  const expected = {beep: 'boop'}

  lib(frock, config, globalConfig, (err, {server, port}) => {
    if (err) {
      t.fail('failed to start server!', err)

      return
    }

    t.equal(testPort, port)

    const req = http.request({port}, res => {
      res.on('data', buf => {
        t.deepEqual(JSON.parse(buf.toString()), expected)
      })
      res.on('end', () => {
        server.destroy(() => t.pass('server destroyed'))
      })
    })

    req.on('error', err => {
      t.fail(err.message)
    })

    req.end()
  })

  function handler (frk, log, opts) {
    /* eslint-disable eqeqeq */
    t.true(frk == frock, 'passes through unmodified frock')
    /* eslint-enable eqeqeq */

    return function (req, res) {
      res.json(expected)
    }
  }

  function middleware (frk, log, opts) {
    return function (req, res, next) {
      t.pass('processed middleware')
      next(req, res)
    }
  }
})

test('rejects non-whitelist clients', t => {
  t.plan(4)

  const frock = {
    handlers: {
      register: () => {},
      get: () => handler
    },
    router: commuter
  }
  const config = {
    port: testPort,
    routes: [
      {
        path: '*',
        methods: 'any',
        handler: 'doesntmatterlol'
      }
    ]
  }

  lib(frock, config, {connection: {whitelist: []}}, (err, {server, port}) => {
    if (err) {
      t.fail('failed to start server!', err)

      return
    }

    t.equal(testPort, port)

    const req = http.request({port}, res => {
      res.on('data', buf => {
        t.pass('got data from server')
      })
      res.on('end', () => {
        t.equal(res.statusCode, 403)
        server.destroy(() => t.pass('server destroyed'))
      })
    })

    req.on('error', err => {
      t.fail(err.message)
    })

    req.end()
  })

  function handler (frk, log, opts) {
    return function () {
      t.fail('client should not connect')
    }
  }
})

test(`teardown ${__filename}`, t => {
  t.plan(1)
  t.pass('tore it down')
})
