module.exports = createPlugin

function createPlugin (frock, logger, options) {
  var router = frock.router(defaultRoute)

  router.get('one', one)
  router.get('two', two)
  router.get('^$', index)

  return router

  function one (req, res) {
    res.end('one!')
  }

  function two (req, res) {
    res.end('two!')
  }

  function index (req, res) {
    res.end('index!')
  }
}

function defaultRoute (req, res) {
  res.e404('no route configured')
}
