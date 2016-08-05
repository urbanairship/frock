const {spawn} = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')

const test = require('tape')
const portfinder = require('portfinder')
const ostmpdir = require('os-tmpdir')
const mkdirp = require('mkdirp').sync

const FROCK_PATH = path.join(__dirname, '..', '..', 'bin', 'frock.js')

let frockfilePath
let port

test(`setup ${__filename}`, (t) => {
  t.plan(1)

  const fp = path.join(__dirname, 'frockfile.json')
  const mp = path.join(__dirname, 'mock', 'get-route.js')
  const frockfile = JSON.parse(
    fs.readFileSync(fp)
  )

  portfinder.getPort((err, foundPort) => {
    if (err) {
      t.fail(err)
    }

    port = foundPort

    // mangle the found ports into the loaded frockfile
    frockfile.servers[0].port = port

    frockfilePath = path.join(ostmpdir(), 'frockfile.json')
    fs.writeFileSync(frockfilePath, JSON.stringify(frockfile))

    // now copy the mock
    mkdirp(path.join(ostmpdir(), 'mock'))
    fs.writeFileSync(path.join(ostmpdir(), 'mock', 'get-route.js'), fs.readFileSync(mp))
    t.pass('set it up')
  })
})

test(`cli integration test`, (t) => {
  t.plan(3)

  const frock = spawn(FROCK_PATH, [frockfilePath])

  // rely on the frock logo output to know when things are ready
  frock.stderr.on('data', () => {
    const req = http.request({port, host: 'localhost'}, (res) => {
      res.on('data', (data) => {
        t.equal(data.toString(), 'whoop')
      })

      res.on('end', () => {
        t.pass('ended request')
        // kill the running process
        frock.kill()
      })
    })

    req.end()
  })

  frock.on('exit', () => {
    t.pass('process exited')
  })
})

test(`teardown ${__filename}`, (t) => {
  t.plan(1)
  t.pass('tore it down')
})
