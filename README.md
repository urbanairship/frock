# frock

An plugin-based HTTP and socket service mock.

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
          },
          "middleware": [
            {
              "handler": "frock-middleware-chaos",
              "options": {
                "responses": [
                  {
                    "status": 500,
                    "message": "whoops",
                    "frequency": 0.1
                  }
                ]
              }
            }
          ]
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
  ],
  "sockets": [
    {
      "port": 8190,
      "handler": "./mocks/socket-service",
      "db": "socket-service",
      "options": {
        "responseType": 10
      }
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

- `ready` (function) optional callback to execute after all servers are started

#### `instance.reload([config] [, ready])`

Stop and restart all servers, optionally loading a new config.

- `config` (object) an optional new config to load
- `ready` (function) optional callback to execute after all servers are
  restarted

#### `instance.stop([ready])`

Shuts down all servers and handlers.

- `ready` (function) optional callback to execute after all servers are ended

## Plugins

A frock plugin is just a factory function that returns a router with some
specific properties. Frock plugins must take this shape:

### Factory Function: `createPlugin(frock, logger, options, [db]) -> router`

The factory function will be called whenever the frock is `run` or on `reload`.

- `frock` The frock instance
- `logger` (function) The frock logger. A [bole][] instance that's
  contextualized with your plugin name and the port on which you're running.
  Example: `logger.info('some message', someObj)`
- `options` the options object that was in the frock config
- `db` if you requested a database, you'll find the [level][levelup] instance
  here

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

#### Frock Methods

The `frock` that you get passed has a number of methods and properties you can
use in your plugins:

- `.router` A router factory, which returns a new router instance. Internally
  `frock` uses [`commuter`][commuter] as its router, and there are benefits to
  you doing the same (see the section on tips for writing plugins)
- `.getOrCreateDb(name)` Get or create a new database with `name`
- `.pwd` - The working directory (where the `frockfile.json` lives)
- `.registerHandler(name)` Register a new handler; the `name` passed is both the
  name of the handler, and what will be passed to `require`, so this can be a
  modulename to be resolved, or a path
- `.version` The semver of the currently running frock

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

You can also call any frock instance's `getOrCreateDb(name)` to get the DB; you
can use this to access other running mock's databases.

### Tips for writing Plugins

- Use the `frock.router` factory if your plugin needs an internal router;
  `frock` uses [`commuter`][commuter] as its router, which has the ability to
  automatically deal with subroutes. This is available as a property of the
  frock to ensure that a frock and its plugins are using the same version of
  `commuter`.
- If you choose to not use `frock.router`, ensure you're stripping the
  `options._path` from what you're passing to your router.
- Make everything configurable; `frock` is very configurable but you can shoot
  yourself in the foot by hard-coding configuration parameters. For instance,
  any running mock can access any other mock's database; if you want to avoid
  collisions you'd best make these configurable in your `frockfile.json`
    - To that end, anything that is in your handler's `options` key is passed
      straight through to your plugin; put whatever you need in there.
    - Don't create your own option keys that start with underscores; these
      should be reserved for `frock` to insert options that your frock might
      need.
    - Don't modify the `frock` that you are passed; this is the global instance
      that is shared between all running mocks.
- Socket mocks are far simpler than HTTP mocks, and haven't the full suite of
  options that a HTTP mock has.
- Don't crash :) Remember that all mocks run in the same process; you bring one
  down and you bring down the whole thing.

## Middlewares

Middleware in frock is a special type of frock plugin; the requirements are
basically the same, but what needs to be called at the end varies. A minimal
middleware example:

### Example

```javascript
module.exports = occasionally401

function occasionally401 (frock, logger, options) {
  return handler

  function handler (req, res, next) {
    if (Math.random() < options.frequency) {
      logger.info('sending 401 via middleware')

      res.statusCode = 401
      return res.end()
    }

    next(req, res)
  }
}
```

Note that its factory function is called with the exact same parameters as a
frock plugin, but the handler needs to take a `next` function. If you don't
directly respond to the request as it moves through your middleware, the last
thing you need to do is call `next` with parameters `(req, res)` to move back
down the chain.

### Notes

- Middleware is currently only availabl for HTTP mocks.
- Middleware is always called in the order it's defined in your
  `frockfile.json`, and can be either a local path to a module, or a `npm`
  installed module, same as a `frock` plugin
- There is an internal utility middleware that is _always_ added to your routes;
  it adds convenience functions such as `res.json` and handles some logging for
  all requests.

## Response Convenience Functions

Each request that passes through `frock` has some convenience functions added
that'll be available before it hits your plugin or middleware:

- `req.GET` an object containing all `GET` parameters that were in the requests
  URL
- `res.json(data, [status = 200])` responds with a JSON payload, optionally
  setting the status:
    - `data` an object to be JSON serialized
    - `status` an optional integer status, such as `201` or `404`; defaults to
      `200`

The following error functions will take a `data` parameter, which can be either
a string or an object; if it's an object, the data will be serialized and the
content type will be set to `application/json` before sending:

- `res.e404([data])` send a 404
- `res.e400([data])` send a 400
- `res.e500([data])` send a 500
- `res.error(Error, [status = 500])` send a 500 with an optional error object,
  the difference with the other options is this one will log an error's
  stacktrace to the console, if present.

## License

Apache 2.0, see [LICENSE](./LICENSE) for details.

[levelup]: https://github.com/Level/levelup
[bole]: http://npm.im/bole
[commuter]: http://npm.im/commuter
