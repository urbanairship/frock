module.exports = createGetRoute

function createGetRoute (frock, logger, options) {
  return (req, res) => {
    res.end(options.message)
  }
}
