/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const test = require('tape')
const through = require('through')
const proxyquire = require('proxyquire')

const fakeModule = require('./stubs/fake-module')

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
    stdin: through(),
    env: {}
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = []

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
  })

  frock.once('instantiated', (_, contents, argv) => {
    t.deepEqual(contents, frockfile)
    t.false(argv.debug)
    t.equal(argv.pwd, '/home')
    t.equal(argv.file, filePath)
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
    stdin: through(),
    env: {}
  }
  const filePath = '/home/wut/local-frockfile.json'
  const frockfile = {jam: true}
  const args = [filePath]

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
  })

  frock.once('instantiated', (_, contents, argv) => {
    t.equal(argv.pwd, '/home/wut')
    t.equal(argv.file, filePath)
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
  t.plan(6)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through(),
    env: {}
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = ['--raw']

  garnish.once('instantiated', () => {
    t.fail('should not instantiate')
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

test('can set debug output', t => {
  t.plan(7)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through(),
    env: {}
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = ['--debug']

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
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

test('can set options with environment flags', t => {
  t.plan(7)

  const processObj = {
    cwd: () => '/home/wut',
    stdout: through(),
    stdin: through(),
    env: {
      FROCK_DEBUG: 'yep'
    }
  }
  const filePath = '/home/frockfile.json'
  const frockfile = {jam: true}
  const args = []

  garnish.once('instantiated', () => {
    t.pass('instantiated garnish')
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
