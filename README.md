# frock

An plugin-based HTTP mock.

## Example

In your working directory, create a `frockfile.json`:

```json
{
  "servers": [
    {
      "port": 8080,
      "routes": [
        {
          "path": "/api/segments",
          "methods": ["GET"],
          "handler": "frock-static",
          "options": {
            "file": "fixtures/static/segments.json",
            "contentType": "application/json"
          }
        },
        {
          "path": "/api/remote",
          "methods": ["GET"],
          "handler": "frock-static",
          "options": {
            "url": "http://paste.prod.urbanairship.com/raw/6255",
            "contentType": "application/json"
          }
        },
        {
          "path": "/api/static/*",
          "methods": ["GET"],
          "handler": "frock-static",
          "options": {
            "dir": "fixtures/static/",
            "baseUrl": "/api/static/"
          }
        },
        {
          "path": "*",
          "methods": "any",
          "handler": "frock-proxy",
          "options": {
            "url": "http://localhost:8052"
          }
        }
      ]
    }
  ]
}
```

Then, run frock:

```shell
$ frock
```

## API

### `frock(config) -> instance`

Instantiates a new frock. Config is as defined above, and isn't exactly locked
in yet.

#### `instance.run([ready])`

Starts the mocks.

- `ready`: (function) optional callback to execute after all servers are started

#### `instance.reload([config] [, ready])`

Stop and restart all servers, optionally loading a new config.

- `config`: (object) an optional new config to load
- `ready`: (function) optional callback to execute after all servers are
  restarted

#### `instance.stop([ready])`

Shuts down all servers and handlers.

- `ready`: (function) optional callback to execute after all servers are ended

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

Additionally, the factory function must expose one method:

- `factory.validate(config)` Validates a configuration object, returns a
  `{key: 'error message'}` object on invalid configuration items, and a falsey
  value if everything is good to go.

The factory function must return a router:

#### Router: `router(req, res)`

A router is a standard nodejs HTTP handler, with a few special methods attached:

##### `end()`

Called when the handler is shut down.

## License

Apache 2.0, see [LICENSE](./LICENSE) for details.
