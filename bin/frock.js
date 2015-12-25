#!/usr/bin/env node

/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
var fs = require('fs')
var path = require('path')

var lib = require('../lib')
var cli = require('../lib/cli')

module.exports = processCli

// if we aren't in testing, we just run the cli
if (require.main === module) {
  processCli()
}

function processCli (_prc) {
  var prc = _prc || process

  cli(prc.argv.slice(2), function (err, options) {
    if (err) {
      throw err
    }

    if (options.launched) {
      var logo = fs.createReadStream(path.join(__dirname, 'logo.txt'))
      logo.pipe(prc.stderr)
    } else if (options.help) {
      var help = fs.createReadStream(path.join(__dirname, 'help.txt'))
      help.pipe(prc.stdout)
      help.on('end', prc.exit.bind(prc, 1))
    } else if (options.version) {
      console.log(require('../package.json').version)
      prc.exit(1)
    }
  })
}

processCli.lib = lib
