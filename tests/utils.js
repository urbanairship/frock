const test = require('tape')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')
const fakeBole = fakeModule({}, ['debug', 'warn', 'error', 'info'])
const fakeRegister = fakeModule({}, ['register'])

const {processMiddleware, noopMiddleware, handleServerError, dup} = proxyquire(
  '../lib/utils',
  {
    'bole': fakeBole.mock,
    './register-handler': fakeRegister.mock,
    '@noCallThru': true
  }
)

test(`setup ${__filename}`, t => {
  t.plan(1)

  t.pass('set it up')
})

test('does not fail on empty middlewares', t => {
  t.plan(1)

  const instance = processMiddleware({}, fakeBole.mock, {}, void 0, route)

  instance()

  function route () {
    t.pass('called route')
  }
})

test('calls middlewares in order', t => {
  t.plan(3)

  const middlewares = [{handler: middleware1}, {handler: middleware2}]
  const instance = processMiddleware({}, fakeBole.mock, {}, middlewares, route)

  let count = 0

  instance()

  function middleware1 () {
    return (req, res, next) => {
      t.equal(count, 0, 'called first middleware')
      ++count
      next()
    }
  }

  function middleware2 () {
    return (req, res, next) => {
      t.equal(count, 1, 'called second middleware')
      next()
    }
  }

  function route () {
    t.pass('called route')
  }
})

test('calls middlewares with correct parameters', t => {
  t.plan(3)

  const frock = {}
  const options = {}
  const middlewares = [{handler: middleware, options}]

  processMiddleware(
    frock,
    fakeBole.mock,
    {},
    middlewares,
    () => {}
  )

  function middleware (frk, log, opts) {
    /* eslint-disable eqeqeq */
    t.ok(frock == frk)
    t.ok(log == fakeBole.mock)
    t.ok(opts == options)
    /* eslint-enable eqeqeq */

    return () => {}
  }
})

test('noop middleware logs and passes on', t => {
  t.plan(4)

  const name = 'some-name'
  const instance = noopMiddleware(name)
  const req = {req: true}
  const res = {res: true}

  fakeBole.once('error', message => {
    t.ok(message.includes(name), 'logs error with missing name')
  })

  instance(req, res, (rq, rs) => {
    t.pass('called next function')
    t.deepEqual(req, rq)
    t.deepEqual(res, rs)
  })
})

test('dup duplicates an object', t => {
  t.plan(2)

  const obj = {anObject: true, someArray: ['is', 'one']}
  const duped = dup(obj)

  /* eslint-disable eqeqeq */
  t.ok(obj != duped, 'is not the same object')
  /* eslint-enable eqeqeq */
  t.deepEqual(duped, obj, 'has the same contents')
})

test('logs server error', t=> {
  t.plan(2)

  const instance = handleServerError({error}, {port: 123})

  instance(new Error('omg'))

  function error (err) {
    t.ok(err, 'error logged')
    t.ok(err.includes('123'), 'includes port number')
  }
})

test(`teardown ${__filename}`, t => {
  t.plan(1)

  t.pass('tore it down')
})
