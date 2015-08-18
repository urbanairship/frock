import fs from 'fs'
import path from 'path'

import minimist from 'minimist'
import find from 'fs-find-root'

import createFrockInstance from './'

export default processCli

function processCli (args, ready) {
  const argv = minimist(args)

  let file = argv._[0]

  // if we weren't given a frockfile path, find one
  if (!argv._[0]) {
    find.file('frockfile.json', process.cwd(), (err, foundFile) => {
      if (err) {
        return ready(err)
      }

      file = foundFile

      fs.readFile(file, onFrockfile)
    })

    return
  }

  fs.readFile(file, onFrockfile)

  function onFrockfile (err, _frockfile) {
    argv.pwd = path.dirname(file)

    let frockfile

    try {
      frockfile = JSON.parse(_frockfile.toString())
    } catch (e) {
      throw new Error(`Error parsing frockfile: ${e}`)
    }

    const frock = createFrockInstance(frockfile, argv)

    frock.run(() => {
      ready(err, {argv, frock, frockfile})
    })
  }
}
