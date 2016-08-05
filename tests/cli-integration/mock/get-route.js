module.exports = createGetRoute

function createGetRoute (frock, logger, options) {
  return function(req, res) {
    res.end(options.message)
  }
}
