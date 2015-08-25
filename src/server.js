import fs from 'fs'
import net from 'net'

import bole from 'bole'

export default startCommandServer

const log = bole('frock/server')

function startCommandServer (frock, socket, ready) {
  const server = net.createServer(client => {
    client.on('data', data => {
      const command = data.toString()

      if (command === 'reload') {
        frock.once('reload', done)
        frock.reload()

        return
      } else if (command === 'stop') {
        frock.once('stop', done)
        frock.stop()

        return
      }

      done(1)

      function done (code = 0) {
        client.write(String(code))
      }
    })
  })

  server.listen(socket, () => {
    log.info(`running on ${socket}`)
    ready(server)
  })

  process.on('uncaughtException', handleUncaughtException)
  process.on('SIGINT', stopServer)
  frock.on('stop', stopServer)

  function stopServer () {
    log.info('cleaning up...')
    server.close(() => unlinkThenExit(1))

    setTimeout(() => {
      log.error('failed to clean up in a reasonable time, forcing...')
      unlinkThenExit(1)
    }, 2000)
  }

  function handleUncaughtException (err) {
    console.error(err.stack)
    unlinkThenExit(1)
  }

  function unlinkThenExit (code) {
    try {
      fs.unlinkSync(socket)
    } finally {
      process.exit(code)
    }
  }
}
