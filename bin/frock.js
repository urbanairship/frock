#!/usr/bin/env node
var fs = require('fs')
var path = require('path')

var cli = require('../lib/cli')

cli(process.argv.slice(2), function (err) {
  if (err) {
    throw err
  }

  var logo = fs.createReadStream(path.join(__dirname, 'logo.txt'))
  logo.pipe(process.stdout)
})
