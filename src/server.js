import fs from 'fs'
import http from 'http'

import bole from 'bole'
import body from 'body/json'
import enableDestroy from 'server-destroy'

import addUtilMiddleware from './utils'

export default startCommandServer

const log = bole('frock/server')

function startCommandServer (frock, socket, ready) {
  const server = http.createServer(addUtilMiddleware(log, handleCommand))

  server.listen(socket, () => {
    log.info(`running on ${socket}`)
    ready(server)
  })

  enableDestroy(server)

  process.on('uncaughtException', handleUncaughtException)
  process.on('SIGINT', stopServer)
  frock.on('stop', stopServer)

  return server

  function handleCommand (req, res) {
    body(req, res, (err, data) => {
      if (err) {
        log.debug('got bad json body', err)

        return res.e500(err)
      }

      const command = data.command

      if (!command) {
        return res.e400('no command provided')
      }

      if (command === 'reload') {
        frock.reload(data.config, done)

        return
      } else if (command === 'stop') {
        frock.stop(false, done)

        return
      }

      function done (err, result) {
        if (err) {
          log.debug('got error from command', err)

          return res.e500(err)
        }

        log.debug(`successfully executed command: ${command}`)

        res.json(result)
      }
    })
  }

  function stopServer () {
    log.info('cleaning up...')
    server.destroy(() => unlinkThenExit(1))

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
