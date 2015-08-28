import http from 'http'

import bole from 'bole'
import concat from 'concat-stream'

export default connectCommandClient

const log = bole('frock/client')

function connectCommandClient (socket, argv, config, ready) {
  const payload = {command: argv.command.trim(), config}
  const postData = JSON.stringify(payload)

  let called = false

  const req = http.request({socketPath: socket}, (res) => {
    res.on('error', onError)
    res.pipe(concat(done))

    function done (data) {
      let response

      if (data && data.length) {
        try {
          response = JSON.parse(data.toString())
        } catch (e) {
          response = null

          log.error(`Got error parsing response: ${e.toString()}`)
        }
      }

      if (res.statusCode !== 200) {
        log.error(`Error ${res.statusCode}`, response)
      }

      if (!called) {
        called = true

        ready(null, {success: true, data})
      }
    }
  })

  req.setHeader('Content-Type', 'application/json')
  req.setHeader('Content-Length', postData.length)
  req.write(postData)
  req.end()

  function onError (err) {
    log.error(err.toString(), err)

    if (!called) {
      called = true

      ready(err)
    }
  }
}
