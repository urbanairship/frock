module.exports = createPlugin

function createPlugin (frock, logger, _options) {
  var options = _options || {}
  var message = options.message || 'no message provided'

  return handler

  function handler (req, res) {
    res.setHeader('content-type', 'text/plain')
    res.end(message)
  }
}
