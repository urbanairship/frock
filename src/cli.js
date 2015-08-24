import fs from 'fs'
import path from 'path'

import chokidar from 'chokidar'
import tmpDir from 'os-tmpdir'
import minimist from 'minimist'
import find from 'fs-find-root'

import createFrockInstance from './'
import startCommandServer from './server.js'
import connectCommandClient from './client.js'

export default processCli

const DEFAULT_SOCKET_NAME = 'frock.sock'

function processCli (args, ready) {
  const options = {
    alias: {
      command: 'c',
      socket: 's',
      nowatch: 'w'
    },
    boolean: ['nowatch']
  }
  const argv = minimist(args, options)

  if (argv.version || argv.help) {
    return ready(null, {version: argv.version, help: argv.help})
  }

  let file = argv._[0]
  let socket = argv.socket ? path.resolve(socket) : null

  // if we were given a command and a socket, no need to read the frockfile
  if (argv.command && socket) {
    return connectCommandClient(socket, argv, ready)
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
      return connectCommandClient(socket, argv, ready)
    }

    const frock = createFrockInstance(frockfile, argv)

    // start command server, then run the frock after it's up
    startCommandServer(frock, socket, () => {
      frock.run(() => {
        // TODO this file watching stuff should be elsewhere
        if (!argv.nowatch) {
          chokidar.watch(file)
            .on('change', onFrockfileChange)
        }

        ready(null, {argv, frock, frockfile, launched: true})
      })
    })

    function onFrockfileChange (path) {
      fs.readFile(path, (err, config) => {
        if (err) {
          console.error(new Error(`Error hot-reloading frockfile`))
        }

        try {
          frockfile = JSON.parse(config.toString())
        } catch (e) {
          console.error(new Error(`Error parsing frockfile: ${e}`))

          return
        }

        frock.reload(frockfile, () => {
          console.log('reloaded')
        })
      })
    }
  }
}
