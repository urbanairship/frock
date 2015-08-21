import url from 'url'

export default addUtilMiddleware

function addUtilMiddleware (logger, router) {
  return processRequest

  function processRequest (req, res) {
    logRequestStarted()

    const parsedUrl = url.parse(req.url, true)

    req.GET = parsedUrl.query || {}

    res.json = json
    res.e404 = e404
    res.e500 = e500
    res.error = error

    res.on('finish', logRequestFinished)

    router(req, res)

    function json (raw, status = 200, {contentType = 'application/json'} = {}) {
      let data

      try {
        data = JSON.stringify(raw)
      } catch (e) {
        data = e.toString()
        status = 500
      }

      res.setHeader('Content-Type', contentType)

      res.statusCode = status
      res.end(data)
    }

    function _exxx (data, status) {
      if (typeof data === 'object') {
        return json(data, 404)
      }

      res.statusCode = 404
      res.end(data)
    }

    function e404 (data) {
      _exxx(data, 404)
    }

    function e500 (data) {
      _exxx(data, 500)
    }

    function error (e, status = 500) {
      res.statusCode = 500
      res.end(e)
    }

    function logRequestStarted () {
      logger('debug', `${req.method}[INCOMING] ${req.url}`)
    }

    function logRequestFinished () {
      logger('info', `${req.method}[${res.statusCode}] ${req.url}`)
    }
  }
}
