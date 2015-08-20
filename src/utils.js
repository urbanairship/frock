import url from 'url'

export default addUtils

function addUtils (logger, router) {
  return processRequest

  function processRequest (req, res) {
    const parsedUrl = url.parse(req.url, true)

    res.json = json
    res.e404 = e404
    res.error = error
    req.GET = parsedUrl.query || {}

    router(req, res)

    function json (raw, status = 200) {
      let data

      try {
        data = JSON.stringify(raw)
      } catch (e) {
        data = e.toString()
        status = 500
      }

      res.setHeader('Content-Type', 'application/json')

      res.statusCode = status
      res.end(data)
    }

    function e404 (data) {
      if (typeof data === 'object') {
        return json(data, 404)
      }

      res.statusCode = 404
      res.end(data)
    }

    function error (e, status = 500) {
      res.statusCode = 500
      res.end(e)
    }
  }
}
