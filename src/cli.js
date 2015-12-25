/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const find = require('fs-find-root')
const bole = require('bole')
const garnish = require('garnish')

const createFrockInstance = require('./')
const createWatcher = require('./watcher')

module.exports = processCli

function processCli (args, _process, ready) {
  const options = {
    alias: {
      nowatch: 'w',
      debug: 'd',
      raw: 'r'
    },
    boolean: ['nowatch', 'debug', 'raw']
  }
  const argv = minimist(args, options)
  const logLevel = argv.debug ? 'debug' : 'info'

  let pc = _process

  if (typeof pc === 'function') {
    pc = process
    ready = _process
  }

  let logOutput = pc.stdout

  if (!argv.raw) {
    logOutput = garnish({level: logLevel})
    logOutput.pipe(pc.stdout)
  }

  bole.output({
    level: logLevel,
    stream: logOutput
  })

  if (argv.version || argv.help) {
    return ready(null, argv)
  }

  let file = argv._[0]

  // if we weren't given a frockfile path, find one
  if (!file) {
    find.file('frockfile.json', pc.cwd(), (err, foundFile) => {
      if (err) {
        return ready(err)
      }

      file = foundFile

      fs.readFile(file, onFrockfile)
    })

    return
  }

  // otherwise, we had a path, so just read the frockfile
  fs.readFile(file, onFrockfile)

  function onFrockfile (err, _frockfile) {
    if (err) {
      return ready(err)
    }

    argv.pwd = path.dirname(file)

    let frockfile

    try {
      frockfile = JSON.parse(_frockfile.toString())
    } catch (e) {
      throw new Error(`Error parsing frockfile: ${e}`)
    }

    const frock = createFrockInstance(frockfile, argv)

    // run frock, create the watcher if requested
    frock.run(() => {
      if (!argv.nowatch) {
        createWatcher(frock, file)
      }

      ready(null, {argv, frock, frockfile, launched: true})
    })
  }
}
