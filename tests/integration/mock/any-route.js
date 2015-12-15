module.exports = createAnyRoute

function createAnyRoute (frock, log, options) {
  return function route (req, res) {
    res.end('any-route')
  }
}
