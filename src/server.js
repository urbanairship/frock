import fs from 'fs'
import net from 'net'

export default startCommandServer

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
    console.log(`## frock command server running on ${socket} ##`)
    ready(server)
  })

  process.on('SIGINT', stopServer)
  frock.on('stop', stopServer)

  function stopServer () {
    console.log('\ncleaning up...')
    server.close(() => unlinkThenExit(1))

    setTimeout(() => {
      console.log('failed to clean up in a reasonable time, forcing...')
      unlinkThenExit(1)
    }, 2000)
  }

  function unlinkThenExit (code) {
    try {
      fs.unlinkSync(socket)
    } finally {
      process.exit(code)
    }
  }
}
