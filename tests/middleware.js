/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const test = require('tape')
const {EventEmitter: EE} = require('events')

const {utilMiddleware, logMiddleware} = require('../lib/middleware')
const {dup} = require('../lib/utils')

test(`set up ${__filename}`, t => {
  t.plan(1)
  t.pass('set it up')
})

test('logMiddleware logs on request start and finish', t => {
  t.plan(7)

  const req = {
    method: 'GET',
    url: 'http://localhost/wutever'
  }
  const res = Object.assign(new EE(), {statusCode: 200})

  const log = {
    debug: str => {
      t.true(str.includes(req.method), 'logs method')
      t.true(str.includes(req.url), 'logs url')
    },
    info: str => {
      t.true(str.includes(req.method), 'logs method')
      t.true(str.includes(req.url), 'logs url')
      t.true(str.includes(String(res.statusCode)), 'logs statusCode')
    }
  }

  const logRequest = logMiddleware({}, log)

  logRequest(req, res, (rq, rs) => {
    /* eslint-disable eqeqeq */
    t.ok(rq == req, 'passes through request unchanged')
    t.ok(rs == res, 'passes through response unchanged')
    /* eslint-enable eqeqeq */

    res.emit('finish')
  })
})

test('utilMiddleware adds new response methods', t => {
  const req = {url: 'http://whatever.com'}
  const res = {}

  const processRequest = utilMiddleware()

  const expectedMethods = [
    'json',
    'e404',
    'e400',
    'e500',
    'error'
  ]

  t.plan(expectedMethods.length)

  processRequest(req, res, (rq, rs) => {
    expectedMethods.forEach(method => {
      t.true(typeof rs[method] === 'function')
    })
  })
})

test('utilMiddleware parses GET strings', t => {
  t.plan(1)

  const req = {url: 'http://localhost/?beep=boop&boop=bop'}
  const res = {}

  const processRequest = utilMiddleware()

  const expected = {
    beep: 'boop',
    boop: 'bop'
  }

  processRequest(req, res, rq => {
    t.deepEqual(rq.GET, expected)
  })
})

test('json methods sends stringified json, sets content type', t => {
  t.plan(3)

  const expectedHeader = ['Content-Type', 'application/json']
  const data = {beep: 'boop'}
  const req = {url: ''}
  const res = {
    setHeader: (...args) => t.deepEqual(args, expectedHeader),
    end: sent => t.equal(sent, JSON.stringify(data))
  }

  const processRequest = utilMiddleware()

  processRequest(req, res, (rq, rs) => {
    rs.json(data)

    process.nextTick(() => t.equal(rs.statusCode, 200))
  })
})

test('can override json content type and status code', t => {
  t.plan(3)

  const expectedHeader = ['Content-Type', 'text/json']
  const data = {beep: 'boop'}
  const req = {url: ''}
  const res = {
    setHeader: (...args) => t.deepEqual(args, expectedHeader),
    end: sent => t.equal(sent, JSON.stringify(data))
  }
  const statusCode = 201

  const processRequest = utilMiddleware()

  processRequest(req, res, (rq, rs) => {
    rs.json(data, statusCode, {contentType: expectedHeader[1]})

    process.nextTick(() => t.equal(rs.statusCode, statusCode))
  })
})

test('json method blows up on bad json, sends error', t => {
  t.plan(3)

  const expectedHeader = ['Content-Type', 'application/json']
  const data = {beep: 'beep'}

  data.beep = data // oh no circular reference!

  const req = {url: ''}
  const res = {
    setHeader: (...args) => t.deepEqual(args, expectedHeader),
    end: sent => t.ok(sent)
  }

  const processRequest = utilMiddleware()

  processRequest(req, res, (rq, rs) => {
    rs.json(data)

    process.nextTick(() => t.equal(rs.statusCode, 500))
  })
})

test('error+status methods call with expected status codes', t => {
  const req = {url: ''}
  const res = {}

  const methods = [
    ['e400', 400],
    ['e404', 404],
    ['e500', 500]
  ]

  t.plan(methods.length * 2)

  const processRequest = utilMiddleware()

  methods.forEach(([method, status]) => {
    processRequest(dup(req), dup(res), next(method, status))
  })

  function next (method, expectedStatus) {
    return (rq, rs) => {
      rs.end = data => t.equal(data, 'beep')
      rs[method]('beep')

      process.nextTick(() => t.equal(rs.statusCode, expectedStatus))
    }
  }
})

test('error method logs error and sends', t => {
  t.plan(4)

  const message = 'oh noes'
  const req = {url: ''}
  const res = {
    setHeader: (...args) => t.deepEqual(args, ['Content-Type', 'application/json']),
    end: () => t.ok('end called')
  }
  const log = {
    debug: () => t.pass('called debug log')
  }
  const processRequest = utilMiddleware({}, log)

  processRequest(req, res, (rq, rs) => {
    rs.error(new Error(message))

    process.nextTick(() => t.equal(rs.statusCode, 500))
  })
})

test('error method status can be overridden', t => {
  t.plan(4)

  const message = 'oh noes'
  const req = {url: ''}
  const res = {
    setHeader: (...args) => t.deepEqual(args, ['Content-Type', 'application/json']),
    end: () => t.ok('end called')
  }
  const log = {
    debug: () => t.pass('called debug log')
  }
  const status = 503

  const processRequest = utilMiddleware({}, log)

  processRequest(req, res, (rq, rs) => {
    rs.error(new Error(message), status)

    process.nextTick(() => t.equal(rs.statusCode, status))
  })
})

test(`teardown ${__filename}`, t => {
  t.plan(1)
  t.pass('tore it down')
})
