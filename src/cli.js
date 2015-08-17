import fs from 'fs'

import minimist from 'minimist'
import find from 'fs-find-root'

import createFrockInstance from './'

export default processCli

function processCli (args, ready) {
  const argv = minimist(args)

  // if we weren't given a frockfile path, find one
  if (!argv._[0]) {
    find.file('frockfile.json', process.cwd(), (err, file) => {
      if (err) {
        return ready(err)
      }

      fs.readFile(file, onFrockfile)
    })

    return
  }

  fs.readFile(argv._[0], onFrockfile)

  function onFrockfile (err, _frockfile) {
    const frockfile = JSON.parse(_frockfile.toString())
    const frock = createFrockInstance(frockfile)

    frock.run(() => {
      ready(err, {argv, frock, frockfile})
    })
  }
}
