# frock

An plugin-based HTTP mock.

## Example

In your working directory, create a `frockfile.js`:

```javascript
var frock = require('frock')
var frockStatic = require('frock-static')
var frockProxy = require('frock-proxy')

var instance = frock({
  servers: [
    {
      port: 8080,
      routes: [
        {
          path: '/api/segments',
          methods: ['GET'],
          handler: 'static',
          options: {
            file: 'fixtures/static/segments.json',
            contentType: 'application/json'
          }
        },
        {
          path: '*',
          methods: 'any',
          handler: 'proxy',
          options: {
            url: 'http://localhost:8052'
          }
        }
      ]
    }
  ]
})

instance.registerHandler('static', frockStatic)
instance.registerHandler('proxy', frockProxy)

instance.run()
```

Then, run frock:

```shell
$ frock
```

## API

### `frock(config) -> instance`

Instantiates a new frock. Config is as defined above, and isn't exactly locked
in yet.

#### `instance.registerHandler(name, plugin)`

Registers a handler (plugin).

- `name`: (string) The unique name the handler is referred to as in your config.
- `plugin`: (function) The plugin's factory function. See the section on Plugins
  for details.

#### `instance.run([ready])`

Starts the mocks.

- `ready`: (function) optional callback to execute after all servers are started

#### `instance.end([ready])`

Shuts down all servers and handlers.

- `ready`: (function) optional callback to execute after all servers are ended

#### `instance.reload(config, [ready])`

This doesn't work yet, but I bet you can guess what it does.

- `config`: (object) a new config to load
- `ready`: (function) optional callback to execute after all servers are
  restarted

## Plugins

A frock plugin is just a factory function that returns a router with some
specific properties. Frock plugins must take this shape:

### Factory Function: `createPlugin(frock, logger, options) -> router`

The factory function will be called whenever the frock is `run` or on `reload`.

- `frock`: The frock instance
- `logger`: (function) The frock logger. Function requires the following:
  - `level`: the log level (debug, info, warn, error)
  - `msg`: the message string to be logged
  - `extra`: (optional) an object associated with the message
- `options`: the options object that was in the frock config

The factory function must return a router:

#### Router: `router(req, res)`

A router is a standard nodejs HTTP handler, with a few special methods attached:

##### `end()`

Called when the handler is shut down.

## License

Apache 2.0
