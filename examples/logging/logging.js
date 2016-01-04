module.exports = createPlugin

function createPlugin (frock, logger, options) {
  logger.debug('returning handler')

  return handler

  function handler (req, res) {
    logger.info('sending hello world message!')
    res.end('hello world!')

    logger.warn('this is a very contrived example')
  }
}
