# Plugins API

What follows is the plugin API documentation: the low-level information you'll
need to write a frock plugin. If you'd prefer some examples to start, please
visit the [examples][] docs, which will introduce you to the various examples
provided.

Additionally, there are two special types of plugins covered in their own
documents:

- [Middleware][middleware] are plugins that run before your main handler; they
  can add functionality that your handler can use, or modify your
  request/response before it reaches the handler.
- [Cores][cores] are plugins that aren't tied to a handler; they are used to
  augment frock's core functionality, and are much less common.

## Detailed Documentation

A frock plugin is just a factory function that returns a router with some
specific properties. Frock plugins must take this shape:

### Factory Function: `createPlugin(frock, logger, options, [db]) -> handlerFn`

The factory function will be called whenever the frock is `run` or on `reload`.

- `frock` The frock singleton instance; all plugins that are run by frock will
  be passed the same instance, so you should take care to not modify it. To
  learn more about the properties and methods available, see the [api][]
  docs.
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

The factory function must return a route handler:

#### Route Handler: `handler(req, res)`

A route handler is a standard nodejs HTTP handler, with a few special methods
attached:

##### `end(cb)`

Called when the handler is shut down. Your plugin _must_ call the provided `cb`
when its work is done; plugins are shut down serially, so if you fail to
callback you'll hang the frock process.

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

**Note:** Asking for a database when the `level` dependency isn't present will
cause an error to be thrown; if you wish to use a database, make sure this
package is available in the package with your `frockfile.json`.

### Version Compatibility

When writing frock plugins that you intend to package and distribute, it's
important to declare version compatibility. frock uses [semver][], and you can
trust that breaking changes will only be introduced in major versions.

To declare compatibility, add a section to your plugin module's `package.json`:

```json
{
  "frock": {
    "compatible-versions": "0.1.0 - 0.9.*"
  }
}
```

The `compatible-versions` key follows the semver rules, [semver][], and is
determined against frock's versions with a:

```javascript
semver.satisfies(frock_version, your_compabile-versions_string)
```

If a plugin does not pass that test, a warning is generated when frock starts,
but it *will not prevent frock from running*, so unexpected behavior could
occur.

**Note:** You do not need to provide any compatibility information for plugins
that are alongside your `frockfile.json`; this is only for plugins that are
published separately.

## Tips for writing Plugins

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
- Use `frock.pwd` whenever you're resolving things; `frock` is meant to run
  using the directory the `frockfile.json` lives in as the working directory;
  doing something different will be unexpected for your users.
- Socket mocks are far simpler than HTTP mocks, and haven't the full suite of
  options that a HTTP mock has.
- Don't crash :) Remember that all mocks run in the same process; you bring one
  down and you bring down the whole thing.
  
## Response Convenience Functions

Each http request that passes through `frock` has some convenience functions
added that'll be available before it hits your plugin or middleware:

- `req.GET` an object containing all `GET` parameters that were in the request's
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

[api]: ./api.md
[examples]: ./examples
[bole]: https://www.npmjs.com/packages/bole
[levelup]: https://www.npmjs.com/packages/levelup
[commuter]: https://www.npmjs.com/packages/commuter
[semver]: https://www.npmjs.com/packages/semver
[middleware]: ./middleware.md
[cores]: ./cores.md
