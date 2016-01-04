# API

frock is primarily a CLI utility, but it can be used programatically:

```bash
$ npm install frock
```

```javascript
// index.js
var fs = require('fs')
var createFrock = require('frock')

var config = fs.readFileSync('path/to/frockfile.json')

var frock = createFrock(config, {pwd: process.cwd()})

frock.run(function () {
  console.log('started!')
})
```

## `createFrock(config, [opts]) -> frock`

Instantiates a new frock.

- `config` is a configuration object, in the [frockfile](./frockfile.md) format
- `opts` is an object with the following properties:
    - `pwd` the current working directory, where frock will perform all of its
      resolution when loading plugins and files.

Returns a `frock`, which is an [`EventEmitter`][ee] with a number of additional
methods and properties; these are split into a few different categories by their
functions:

### Methods

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

### Factories

Factories allow you to create new objects/methods using frock's internal
libraries, ensuring that your plugin uses the same version as the core `frock`:

- `.router` A router factory, which returns a new router instance. Internally
  `frock` uses [`commuter`][commuter] as its router, and there are benefits to
  you doing the same (see the section on tips for writing plugins)
- `.logger` A logger factory; in general you'll use the logger you're passed,
  but you might want access to the core logger, say to listen to events; `frock`
  uses [`bole`][bole] as its logger, and this gives you access to its singleton.

### Registries

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

### Properties

- `.pwd` - The working directory (where the `frockfile.json` lives)
- `.version` The [semver][] of the currently running frock

### Events

- `run`: emits when the `frock` instance is running, after all services have
  been started
- `reload`: emits after the `frock` instance has successfully shut down all
  services and restarted them
- `stop`: emits just before the `frock` instance shuts down (and the process
  exits)

[examples]: ./examples
[bole]: https://www.npmjs.com/packages/bole
[levelup]: https://www.npmjs.com/packages/levelup
[commuter]: https://www.npmjs.com/packages/commuter
[semver]: https://www.npmjs.com/packages/semver
[middleware]: ./middleware.md
[cores]: ./cores.md 
[ee]: https://nodejs.org/api/events.html#events_class_events_eventemitter
