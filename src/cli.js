import fs from 'fs'
import path from 'path'
import net from 'net'

import tmpDir from 'os-tmpdir'
import minimist from 'minimist'
import find from 'fs-find-root'

import createFrockInstance from './'

export default processCli

const DEFAULT_SOCKET_NAME = 'frock.sock'

function processCli (args, ready) {
  const options = {
    alias: {
      command: 'c',
      patch: 'p',
      socket: 's'
    }
  }
  const argv = minimist(args, options)

  if (argv.version || argv.help) {
    return ready(null, {version: argv.version, help: argv.help})
  }

  let file = argv._[0]
  let socket = argv.socket ? path.resolve(socket) : null

  if (argv.command && socket) {
    connectServer(socket, argv, ready)
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
      connectServer(socket, argv, ready)

      return
    }

    startServer()

    function startServer () {
      const frock = createFrockInstance(frockfile, argv)
      const server = net.createServer(client => {
        client.on('data', data => {
          const command = data.toString()

          if (command === 'restart') {
            console.log('would restart')
          } else if (command === 'stop') {
            console.log('would stop')
          } else {
            console.log('unrecognized command', command)
          }

          client.write('success')
        })
      })

      server.listen(socket, () => {
        // on shutdown we need to murder the socket
        process.on('SIGINT', () => {
          console.log('cleaning up...')
          server.close(() => {
            try {
              fs.unlinkSync(socket)
            } finally {
              process.exit(1)
            }
          })

          setTimeout(() => {
            console.log('failed to clean up in a reasonable time, forcing...')
            try {
              fs.unlinkSync(socket)
            } finally {
              process.exit(1)
            }
          }, 2000)
        })

        frock.run(() => {
          ready(null, {argv, frock, frockfile, launched: true})
        })
      })
    }
  }

  function connectServer (path, argv, ready) {
    const client = net.connect({path}, () => {
      console.log('connected')
      client.write(argv.command)
    })

    client.on('data', data => {
      console.log(data.toString())
      client.end()
    })

    client.on('end', () => {
      console.log('done')
      ready(null, {success: true})
    })
  }
}
