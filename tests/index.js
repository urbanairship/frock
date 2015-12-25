/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
try {
  require('babel-polyfill')
} catch (e) {
  // babel polyfill throws if it's ever included in any other module
}

require('./cli')
require('./core-httpserver')
require('./core-socketserver')
require('./cores')
require('./middleware')
require('./register-config')
require('./register-db')
require('./register-handler')
require('./utils')

require('./integration')
