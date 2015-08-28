import fs from 'fs'
import path from 'path'

import tmpDir from 'os-tmpdir'
import minimist from 'minimist'
import find from 'fs-find-root'
import bole from 'bole'
import garnish from 'garnish'

import createFrockInstance from './'
import startCommandServer from './server'
import connectCommandClient from './client'
import createWatcher from './watcher'

export default processCli

const DEFAULT_SOCKET_NAME = 'frock.sock'

function processCli (args, ready) {
  const options = {
    alias: {
      command: 'c',
      socket: 's',
      nowatch: 'w',
      debug: 'd',
      raw: 'r'
    },
    boolean: ['nowatch', 'debug', 'raw']
  }
  const argv = minimist(args, options)
  const logLevel = argv.debug ? 'debug' : 'info'

  let logOutput = process.stdout

  if (!argv.raw) {
    logOutput = garnish({level: logLevel})
    logOutput.pipe(process.stdout)
  }

  bole.output({
    level: logLevel,
    stream: logOutput
  })

  if (argv.version || argv.help) {
    return ready(null, {version: argv.version, help: argv.help})
  }

  let file = argv._[0]
  let socket = argv.socket ? path.resolve(socket) : null

  // if we were given a command and a socket, no need to read the frockfile
  // unless specified explicitly
  if (argv.command && socket && !argv._[0]) {
    return connectCommandClient(socket, argv, null, ready)
  }

  // if we weren't given a frockfile path, find one
  if (!file) {
    find.file('frockfile.json', process.cwd(), (err, foundFile) => {
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

    if (!socket) {
      socket = path.join(tmpDir(), frockfile.socketName || DEFAULT_SOCKET_NAME)
    }

    if (argv.command) {
      return connectCommandClient(socket, argv, frockfile, ready)
    }

    const frock = createFrockInstance(frockfile, argv)

    // start command server, then run the frock after it's up
    startCommandServer(frock, socket, () => {
      frock.run(() => {
        if (!argv.nowatch) {
          createWatcher(frock, file)
        }

        ready(null, {argv, frock, frockfile, launched: true})
      })
    })
  }
}
