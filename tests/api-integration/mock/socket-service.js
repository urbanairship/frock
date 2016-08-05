/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
module.exports = createSocketRoute

function createSocketRoute (frock, log, options) {
  return function route (client) {
    client.write('socket')
    client.end()
  }
}
