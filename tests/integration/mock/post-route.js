module.exports = createPostRoute

function createPostRoute (frock, log, options) {
  return function route (req, res) {
    res.end('post-route')
  }
}
