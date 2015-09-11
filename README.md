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

The `frock` command will search upward from your current directory for a
`frockfile.json`, and run it; it will also start up a watcher on that file and
hot-reload on any changes made to it.

Use the built-in help to learn about other options:

```shell
$ frock --help
```

## API

### `frock(config) -> instance`

Instantiates a new frock. Config is as defined above. The instance has a number
of properties and methods attached, see the section on the
[frock singleton](#frock-singleton) for more information.


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

#### Frock Singleton

The `frock` that you get passed has a number of methods and properties you can
use in your plugins. It is also an [`EventEmitter`][ee], and emits a number of
events when internal operations occur.

##### Methods

These publicly available methods allow you to control the state of the `frock`
instance:

- `.run([ready])` Starts the mocks.
    - `ready` (function) optional callback to execute after all servers are
      started
- `.reload([config] [, ready])` Stop and restart all servers, optionally loading
  a new config.
    - `config` (object) an optional new config to load
    - `ready` (function) optional callback to execute after all servers are
      restarted
- `.stop([ready])` Shuts down all servers and handlers.
    - `ready` (function) optional callback to execute after all servers are
      ended

##### Factories

Factories allow you to create new objects/methods using frock's internal
libraries, ensuring that your plugin uses the same version as the core `frock`:

- `.router` A router factory, which returns a new router instance. Internally
  `frock` uses [`commuter`][commuter] as its router, and there are benefits to
  you doing the same (see the section on tips for writing plugins)
- `.logger` A logger factory; in general you'll use the logger you're passed,
  but you might want access to the core logger, say to listen to events; `frock`
  uses [`bole`][bole] as its logger, and this gives you access to its singleton.

##### Registries

Registries are `Map` objects storing external dependencies, and allowing you to
register new dependencies:

- `.dbs` A `Map` containing the key/value databases as `name/levelDb`; with some
  additional methods for registering databases; this is an alternate allowed
  from within your plugin, rather than using the `db` config parameter which
  automatically creates a database for you:
    - `.dbs.register(name)` Given a string `name` create or get a database with
      that name
- `.handlers` A `Map` containing the key/value handlers as
  `name/handlerFunction`; also has an additional method not typically found on a
  `Map`:
    - `.handlers.register(name)` Given a requirable string/path `name` this will
      require and save a handler; anything you pass as `name` will be resolved
      using node's `require` resolution process, required, and saved to the
      `Map`

##### Properties

- `.pwd` - The working directory (where the `frockfile.json` lives)
- `.version` The [semver][semver] of the currently running frock

##### Events

- `run`: emits when the `frock` instance is running, after all services have
  been started
- `reload`: emits after the `frock` instance has successfully shut down all
  services and restarted them
- `stop`: emits just before the `frock` instance shuts down (and the process
  exits)

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

You can also call any frock instance's `dbs.register(name)` to get the DB; you
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
- Use `frock.pwd` whenever you're resolving things; `frock` is mean to run using
  the directory the `frockfile.json` lives in as the working directory; doing
  something different will be unexpected for your users.
- You should expect a `frock.version` and throw if you don't see something
  compatible; frock respects [semver][semver] and won't make breaking changes
  without bumping major versions, so you're save to trust a major-version for
  your plugin's compatibility.
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

- Middleware is currently only available for HTTP mocks.
- Middleware is always called in the order it's defined in your
  `frockfile.json`, and can be either a local path to a module, or a `npm`
  installed module, same as a `frock` plugin
- There is an internal utility middleware that is _always_ added to your routes;
  it adds convenience functions such as `res.json` and handles some logging for
  all requests.

## Cores

Cores in frock are another special type of frock plugin; they can do anything,
and have access to the core `frock` but they will _never_ be restarted once
loaded; cores are used to provide control functions to frock, an example might
be a listener that reloads frock when it receives a POST to its interface:

### Example

```javascript
// in file <project_root>/cores/reload-control.js
var http = require('http')

module.exports = reloadCore

function reloadCore (frock, logger, options) {
  var server = http.createServer(handleRequest)

  server.listen(options.port || 9001, function () {
    logger.info('listening')
  })

  function handleRequest (req, res) {
    if (req.method.toLowerCase() === 'post') {
      frock.reload(function () {
        res.statusCode = 200
        res.end('reloaded')
      })

      return
    }

    res.statusCode = 400
    res.end('bad request')
  }
}
```

Note that its factory function is called with the exact same parameters as a
frock plugin, but doesn't need to return anything. Once instantiated, it just
runs until the frock process exits.

Cores are configured in your project's `package.json`, not in the
`frockfile.json`:

```json
{
  "name": "frock-test-project",
  "version": "0.0.0",
  "dependencies": {
    "frock": "0.0.3",
  },
  "frock": {
    "cores": [
      {
        "handler": "./cores/reload-control",
        "options": {
          "port": 9090
        }
      }
    ]
  }
}
```

## Response Convenience Functions

Each http request that passes through `frock` has some convenience functions
added that'll be available before it hits your plugin or middleware:

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
[semver]: http://npm.im/semver
[ee]: https://nodejs.org/api/events.html#events_class_events_eventemitter
