import fs from 'fs'
import {EventEmitter} from 'events'

import chokidar from 'chokidar'

export default createWatcher

function createWatcher (frock, logger, file) {
  const events = new EventEmitter()

  chokidar.watch(file)
    .on('change', onFrockfileChange)

  return events

  function onFrockfileChange (path) {
    fs.readFile(path, (err, config) => {
      let frockfile

      if (err) {
        events.emit('error', err)

        return logger('error', 'Error hot-reloading frockfile', err)
      }

      try {
        frockfile = JSON.parse(config.toString())
      } catch (e) {
        logger('error', `Error parsing frockfile: ${e}`, e)

        return
      }

      events.emit('change', frockfile)

      frock.reload(frockfile, () => {
        logger('info', 'Reloaded on frockfile file change')

        events.emit('reload', frockfile)
      })
    })
  }
}
