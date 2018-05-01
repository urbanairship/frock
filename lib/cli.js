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

module.exports = processCli

function processCli (args, _process, ready) {
  let pc = _process || process

  if (typeof pc === 'function') {
    pc = process
    ready = _process
  }

  const options = {
    alias: {
      debug: 'd',
      raw: 'r'
    },
    boolean: ['debug', 'raw', 'unsafe-disable-connection-filtering'],
    default: {
      debug: Boolean(pc.env.FROCK_DEBUG),
      raw: Boolean(pc.env.FROCK_RAW_OUTPUT),
      'unsafe-disable-connection-filtering': Boolean(
        pc.env.FROCK_UNSAFE_DISABLE_CONNECTION_FILTERING
      )
    }
  }
  const argv = minimist(args, options)
  const logLevel = argv.debug ? 'debug' : 'info'

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
    find.file('frockfile.json', pc.cwd())
      .then(foundFile => {
        file = foundFile

        fs.readFile(file, onFrockfile)
      })
      .catch(err => {
        ready(err)
      })

    return
  }

  // otherwise, we had a path, so just read the frockfile
  fs.readFile(file, onFrockfile)

  function onFrockfile (err, _frockfile) {
    if (err) {
      return ready(err)
    }

    argv.file = file
    argv.pwd = path.dirname(file)

    let frockfile

    try {
      frockfile = JSON.parse(_frockfile.toString())
    } catch (e) {
      throw new Error(`Error parsing frockfile: ${e}`)
    }

    const frock = createFrockInstance(frockfile, argv)

    frock.run(() => {
      ready(null, {argv, frock, frockfile, launched: true})
    })
  }
}
