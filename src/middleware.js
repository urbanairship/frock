/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const url = require('url')

module.exports = {utilMiddleware, logMiddleware}

function logMiddleware (frock, log, options) {
  return logRequest

  function logRequest (req, res, next) {
    logRequestStarted()

    res.on('finish', logRequestFinished)

    next(req, res)

    function logRequestStarted () {
      log.debug(`${req.method}[INCOMING] ${req.url}`)
    }

    function logRequestFinished () {
      log.info(`${req.method}[${res.statusCode}] ${req.url}`)
    }
  }
}

function utilMiddleware (frock, log, options) {
  return processRequest

  function processRequest (req, res, next) {
    const parsedUrl = url.parse(req.url, true)

    req.GET = parsedUrl.query || {}

    res.json = json
    res.e404 = e404
    res.e400 = e400
    res.e500 = e500
    res.error = error

    next(req, res)

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
        return json(data, status)
      }

      if (data && data.toString) {
        data = data.toString()
      }

      res.statusCode = status
      res.end(data)
    }

    function e400 (data) {
      _exxx(data, 400)
    }

    function e404 (data) {
      _exxx(data, 404)
    }

    function e500 (data) {
      _exxx(data, 500)
    }

    function error (e, status = 500) {
      log.debug(e.stack)

      _exxx(e, status)
    }
  }
}
