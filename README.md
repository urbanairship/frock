# frock

An plugin-based HTTP mock.

## Example

In your working directory, create a `frockfile.json`:

```json
{
  "db": {
    "path": "_db"
  },
  "connection": {
    "whitelist": ["127.0.0.1", "::1"]
  },
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
            "url": "http://raw.githubusercontent.com/somewhere/something.json",
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

Install the plugins you requested:

```shell
$ npm install frock-static frock-proxy
```

Then, run frock:

```shell
$ frock
```

## CLI

The when frock is run, it creates a foreground process that logs at whatever
logging level you have set (`info` by default). However, you can control a
running `frock` from your CLI:

```shell
$ frock -c reload  # stops and restarts all the currently running mocks
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
  - `db`: The [level][levelup] instance
- `logger`: (function) The frock logger. A [bole][] instance that's
  contextualized with your plugin name and the port on which you're running.
  Example: `logger.info('some message', someObj)`
- `options`: the options object that was in the frock config

Additionally, the factory function must expose one method:

- `factory.validate(config)` Validates a configuration object, returns a
  `{key: 'error message'}` object on invalid configuration items, and a falsey
  value if everything is good to go.

The factory function must return a router:

#### Router: `router(req, res)`

A router is a standard nodejs HTTP handler, with a few special methods attached:

##### `end(cb)`

Called when the handler is shut down. Your plugin _must_ call the provided `cb`
when its work is done.

### Database

If you create a `db` in your frockfile, you can request a db to be passed to any
plugin; you can use this to create some persistence in your mocks. A database is
passed per name, so it's up to you to define how you use them. This isn't meant
to be safe; it's meant to be flexible. An example config:

```json
{
  "db": {
    "path": "_db"
  },
  "servers": [
    {
      "port": 8081,
      "routes": [
        {
          "path": "/api/whatever/*",
          "methods": ["GET"],
          "handler": "some-handler",
          "db": "some-db"
        }
      ]
    }
  ]
}
```

When you use this config, a [level][levelup] instance called "some-db" will be
created in your `db.path` folder that was specified, and it'll be passed as the
last parameter to the `frock` plugin's factory function.

You can also call any frock instance's `db.get(name)` to get the DB; you can use
this to access other running mock's databases.

## License

Apache 2.0, see [LICENSE](./LICENSE) for details.

[levelup]: https://github.com/Level/levelup
[bole]: http://npm.im/bole
