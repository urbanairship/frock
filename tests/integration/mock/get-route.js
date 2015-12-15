module.exports = createGetRoute

function createGetRoute (frock, log, options) {
  return function route (req, res) {
    res.end(options.message)
  }
}
