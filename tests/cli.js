const test = require('tape')
const through = require('through')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')

const watcher = fakeModule()
const frock = fakeModule(void 0, ['run'])
const garnish = fakeModule(void 0, void 0, true)
const bole = {}
const fs = {}
const find = {}

const lib = proxyquire(
  '../lib/cli.js',
  {
    'fs': fs,
    'fs-find-root': find,
    'bole': bole,
    'garnish': garnish.mock,
    './': frock.mock,
    './watcher': watcher.mock,
    '@noCallThru': true
  }
)

test(`setup ${__filename}`, t => {
  t.plan(1)
  t.pass('set it up')
})

test('correctly sets defaults, performs setup', t => {
  t.plan(13)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through()
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = []

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
  })

  watcher.once('instantiated', (...args) => {
    t.equal(args[2], filePath, 'instantiated watcher with frockfile')
  })

  frock.once('instantiated', (_, contents, argv) => {
    t.deepEqual(contents, frockfile)
    t.false(argv.debug)
    t.equal(argv.pwd, '/home')
  })

  frock.once('run', ready => {
    t.pass('ran frock')

    ready()
  })

  bole.output = opts => {
    t.equal(opts.level, 'info', 'instantiated with correct log level')
  }

  find.file = (name, cwd, ready) => {
    t.equal(cwd, processObj.cwd(), 'called file finder with pwd')

    process.nextTick(() => ready(null, filePath))
  }

  fs.readFile = (file, ready) => {
    t.equal(file, filePath, 'called readfile with frockfile path')

    process.nextTick(() => ready(null, JSON.stringify(frockfile)))
  }

  lib(args, processObj, (err, result) => {
    t.notOk(err, 'no error was set')
    t.ok(result.argv)
    t.ok(result.frockfile)
    t.true(result.launched)
  })
})

test('can pass a frockfile path', t => {
  t.plan(7)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through()
  }
  const filePath = '/home/wut/local-frockfile.json'
  const frockfile = {jam: true}
  const args = [filePath]

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
  })

  watcher.once('instantiated', (...args) => {
    t.equal(args[2], filePath, 'instantiated watcher with frockfile')
  })

  frock.once('instantiated', (_, contents, argv) => {
    t.equal(argv.pwd, '/home/wut')
  })

  frock.once('run', ready => {
    t.pass('ran frock')

    ready()
  })

  bole.output = opts => {
    t.equal(opts.level, 'info', 'instantiated with correct log level')
  }

  find.file = () => {
    t.fail('should not be called')
  }

  fs.readFile = (file, ready) => {
    t.equal(file, filePath, 'called readfile with frockfile path')

    process.nextTick(() => ready(null, JSON.stringify(frockfile)))
  }

  lib(args, processObj, (err, result) => {
    t.notOk(err, 'no error was set')
  })
})

test(`raw output skips bole`, t => {
  t.plan(7)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through()
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = ['--raw']

  garnish.once('instantiated', () => {
    t.fail('should not instantiate')
  })

  watcher.once('instantiated', (...args) => {
    t.equal(args[2], filePath, 'instantiated watcher with frockfile')
  })

  frock.once('instantiated', (_, contents, argv) => {
    t.true(argv.raw)
  })

  frock.once('run', ready => {
    t.pass('ran frock')

    ready()
  })

  bole.output = opts => {
    t.equal(opts.level, 'info', 'instantiated with correct log level')
  }

  find.file = (name, cwd, ready) => {
    t.pass('called file finder')

    process.nextTick(() => ready(null, filePath))
  }

  fs.readFile = (file, ready) => {
    t.pass('called fs')

    process.nextTick(() => ready(null, JSON.stringify(frockfile)))
  }

  lib(args, processObj, (err, result) => {
    t.notOk(err, 'no error was set')

    garnish.removeAllListeners()
  })
})

test(`raw output skips bole`, t => {
  t.plan(7)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through()
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = ['--nowatch']

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
  })

  watcher.once('instantiated', () => {
    t.fail('should not instantiate')
  })

  frock.once('instantiated', (_, contents, argv) => {
    t.pass('instantiated frock')
  })

  frock.once('run', ready => {
    t.pass('ran frock')

    ready()
  })

  bole.output = opts => {
    t.equal(opts.level, 'info', 'instantiated with correct log level')
  }

  find.file = (name, cwd, ready) => {
    t.pass('called file finder')

    process.nextTick(() => ready(null, filePath))
  }

  fs.readFile = (file, ready) => {
    t.pass('called fs')

    process.nextTick(() => ready(null, JSON.stringify(frockfile)))
  }

  lib(args, processObj, (err, result) => {
    t.notOk(err, 'no error was set')

    watcher.removeAllListeners()
  })
})

test('can set debug output', t => {
  t.plan(8)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through()
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = ['--debug']

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
  })

  watcher.once('instantiated', () => {
    t.pass('instantiated watcher')
  })

  frock.once('instantiated', (_, contents, argv) => {
    t.pass('instantiated frock')
  })

  frock.once('run', ready => {
    t.pass('ran frock')

    ready()
  })

  bole.output = opts => {
    t.equal(opts.level, 'debug', 'instantiated with correct log level')
  }

  find.file = (name, cwd, ready) => {
    t.pass('called file finder')

    process.nextTick(() => ready(null, filePath))
  }

  fs.readFile = (file, ready) => {
    t.pass('called fs')

    process.nextTick(() => ready(null, JSON.stringify(frockfile)))
  }

  lib(args, processObj, (err, result) => {
    t.notOk(err, 'no error was set')
  })
})

test(`teardown ${__filename}`, t => {
  t.plan(1)
  t.pass('tore it down')
})
