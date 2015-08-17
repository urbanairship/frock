#!/usr/bin/env node

var cli = require('../lib/cli')

cli(process.argv.slice(2), function (err) {
  if (err) {
    throw err
  }

  console.log('frock: fired it up')
})
