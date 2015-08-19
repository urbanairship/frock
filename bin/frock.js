#!/usr/bin/env node
var fs = require('fs')
var path = require('path')

var cli = require('../lib/cli')

cli(process.argv.slice(2), function (err, options) {
  if (err) {
    throw err
  }

  if (options.launched) {
    var logo = fs.createReadStream(path.join(__dirname, 'logo.txt'))
    logo.pipe(process.stdout)
  } else if (options.help) {
    var help = fs.createReadStream(path.join(__dirname, 'help.txt'))
    help.pipe(process.stdout)
    help.on('end', process.exit.bind(process, 1))
  } else if (options.version) {
    console.log(require('../package.json').version)
    process.exit(1)
  }
})
