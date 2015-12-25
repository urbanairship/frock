/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const fs = require('fs')
const {EventEmitter} = require('events')

const chokidar = require('chokidar')
const bole = require('bole')

const log = bole('frock/watcher')

module.exports = createWatcher

function createWatcher (frock, file) {
  const events = new EventEmitter()

  chokidar.watch(file, {usePolling: true, interval: 1000})
    .on('change', onFrockfileChange)
    .on('raw', (event, path, details) => log.debug(event, path, details))

  return events

  function onFrockfileChange (path) {
    fs.readFile(path, (err, config) => {
      let frockfile

      if (err) {
        events.emit('error', err)

        return log.error('Error hot-reloading frockfile', err)
      }

      try {
        frockfile = JSON.parse(config.toString())
      } catch (e) {
        log.error(`Error parsing frockfile: ${e}`, e)

        return
      }

      events.emit('change', frockfile)

      frock.reload(frockfile, () => {
        log.info('Reloaded on frockfile file change')

        events.emit('reload', frockfile)
      })
    })
  }
}
