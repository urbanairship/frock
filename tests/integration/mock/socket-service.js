module.exports = createSocketRoute

function createSocketRoute (frock, log, options) {
  return function route (client) {
    client.write('socket')
    client.end()
  }
}
