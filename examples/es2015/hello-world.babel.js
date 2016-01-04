module.exports = createPlugin

function createPlugin (frock, logger, {message = 'hello world!'} = {}) {
  return (req, res) => {
    res.end(message)
  }
}
