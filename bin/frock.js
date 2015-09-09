#!/usr/bin/env node
var fs = require('fs')
var path = require('path')

var cli = require('../lib/cli')

module.exports = processCli

// if we aren't in testing, we just run the cli
if (!process.env['__FROCK_TEST_ENV']) {
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
