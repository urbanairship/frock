/**
 * Copyright 2015 Urban Airship Inc. and Contributors. Subject to the LICENSE
 * file at the top-level directory of this distribution and at
 * https://github.com/urbanairship/frock/blob/master/LICENSE
 */
const fs = require('fs')
const http = require('http')
const net = require('net')
const path = require('path')
const url = require('url')

const test = require('tape')
const portfinder = require('portfinder')
const proxyquire = require('proxyquire')

const fakeModule = require('../stubs/fake-module')
const fakeBole = fakeModule({}, ['debug', 'warn', 'error', 'info'])

const lib = proxyquire(
  '../../lib',
  {
    'bole': fakeBole.mock,
    '@noCallThru': true
  }
)

const pwd = __dirname

const TEST_HEADER_NAME = 'x-frock-header'

let ports
let frockfile
let frock

test(`setup ${__filename}`, t => {
  t.plan(1)

  frockfile = JSON.parse(fs.readFileSync(path.join(__dirname, 'frockfile.json')))

  portfinder.getPorts(3, (err, foundPorts) => {
    if (err) {
      t.fail(err)
    }

    ports = foundPorts

    // mangle the found ports into the loaded frockfile
    frockfile.servers[0].port = ports[0]
    frockfile.servers[1].port = ports[1]
    frockfile.sockets[0].port = ports[2]

    frock = lib(frockfile, {pwd})

    frock.run(err => {
      if (err) {
        t.fail(err)
      }

      t.pass('started frock instance')
    })
  })

  fakeBole.on('error', () => {}) // silences eventemitter errors
})

test('can contact started http services', t => {
  const servers = [
    ['get', `http://localhost:${ports[0]}`, 'any-route'],
    ['get', `http://localhost:${ports[0]}/path/`, 'whoop'],
    ['post', `http://localhost:${ports[0]}/path/`, 'post-route'],
    ['get', `http://localhost:${ports[1]}/`, 'any-route']
  ]

  t.plan(servers.length)

  servers.forEach(([method, path, expected]) => {
    makeRequest(method, path, (err, result) => {
      if (err) t.fail('error during request', err)
      t.equal(result, expected)
    })
  })
})

test('middleware was set where appropriate', t => {
  t.plan(3)

  makeRequest('get', `http://localhost:${ports[0]}`, (err, _, res) => {
    if (err) t.fail('got error', err)
    t.notOk(res.headers[TEST_HEADER_NAME], 'no middleware applied')
  })
  makeRequest('get', `http://localhost:${ports[0]}/path/`, (err, _, res) => {
    if (err) t.fail('got error', err)
    t.equal(res.headers[TEST_HEADER_NAME], 'frock', 'per-route middleware')
  })
  makeRequest('get', `http://localhost:${ports[1]}/`, (err, _, res) => {
    if (err) t.fail('got error', err)
    t.equal(res.headers[TEST_HEADER_NAME], 'frock', 'per-server middleware')
  })
})

test('can contact started socket server', t => {
  t.plan(1)

  const client = net.createConnection(ports[2], () => {
    client.on('data', buf => {
      t.equal(buf.toString(), 'socket')
    })
  })
})

test('can restart frock', t => {
  t.plan(2)

  frock.reload(() => {
    t.pass('reloaded')

    makeRequest('get', `http://localhost:${ports[0]}`, (err, result) => {
      if (err) t.fail('got error', err)
      t.equal(result, 'any-route')
    })
  })
})

test(`teardown ${__filename}`, t => {
  t.plan(1)
  frock.stop(() => t.pass('tore it down'))
})

function makeRequest (method, path, ready) {
  const req = http.request(Object.assign(url.parse(path), {method}), res => {
    res.on('data', buf => {
      ready(null, buf.toString(), res)
    })
  })

  req.on('error', err => ready(err))

  if (method === 'post') {
    req.write(new Buffer('payload'))
  }

  req.end()
}
