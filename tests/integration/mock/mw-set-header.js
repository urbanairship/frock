module.exports = createHeaderMw

function createHeaderMw (frock, log, options) {
  return function middleware (req, res, next) {
    res.setHeader('X-Frock-Header', 'frock')
    next(req, res)
  }
}
