/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
module.exports = createHeaderMw

function createHeaderMw (frock, log, options) {
  return function middleware (req, res, next) {
    res.setHeader('X-Frock-Header', 'frock')
    next(req, res)
  }
}
