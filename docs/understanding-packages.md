# Understanding Packages

`frock` is a CLI tool that's designed to help you with your projects; this makes
it akin to tools like [grunt][] and [gulp][], where it uses a project-local
configuration file, but expects to be installed in your `PATH` so that it can
be run from your command line.

This problably makes you think that `frock` should be installed *globally*, e.g.
with an `npm install -g`, but this is *not* the best configuration for frock:
you should instead be installing it as a `devDependency` into your project, with
`npm install --save-dev frock`. If your environment isn't configured to run
Node.js CLI tools that are locally installed in a project, it's suggested that
you configure it as follows:

- The easiest/best method is generally to add the local `node_modules/.bin` to
  your `PATH`. See [this stack overflow post][so] for further information.
- Failing that, you can use [npm run scripts][run-scripts] to run `frock`; npm
  automatically handles the `PATH` for you, and can use a locally installed CLI
  tool.
  
## `frock` Module Resolution

Because `frock` is intended to be used within your individual projects, it
resolves any module you request from the _local_ package. This is easiest to
see in the [examples](./examples), which contain example `package.json` files
for a working frock project.

The module resolution process works exactly the same as the standard
[node module resolution process][node-modules], but it resolves them using the
path to your `frockfile.json` as the base directory. So given the following
directory structure:

```
my-project
| frockfile.json
| package.json
| mocks/
| | mock-api-handler.js
| node_modules/
| | frock-static/
| static/
```

You would prepare a `frockfile.json` like this:

```json
{
  "servers": [
    {
      "port": 8080,
      "routes": [
        {
          "path": "/api/",
          "methods": "any",
          "handler": "./mocks/mock-api-handler"
        },
        {
          "path": "*",
          "methods": "any",
          "handler": "frock-static",
          "options": {
            "dir": "./static"
          }
        }
      ]
    }
  ]
}
```

This will resolve exactly as you would probably guess; the resolution is done
from the `frockfile.json`, using the standard resolution process, so the handler
`frock-static` will resolve to the module installed at
`node_modules/frock-static` and `./mocks/mock-api-handler` will resolve to the
file `./mocks/mock-api-handler.js`.

## `frockfile.json` Resolution

When you run `frock`, it will search for a `frockfile.json` from the current
directory upward; the process is the same as `npm` searching for a
`package.json`. Just as with `npm`, when it finds a frockfile it will use the
frockfile's parent directory as its working directory, performing all module
resolution from that directory.

## Using `frock` in your projects

`frock` is meant to be included in your packages as a dev-dependency, similar
to a `grunt` or `gulp` setup. Continuing on from the `my-project` example above,
your `package.json` would look something like this:

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "description": "My awesome project.",
  "scripts": {
    "frock": "frock"
  },
  "devDependencies": {
    "frock": "^1.0.1",
    "frock-static": "^1.0.0"
  },
  "dependencies": {}
}
```

This will allow local development to be done using `frock`, but without
installing those dependencies when your project is in production. Additionally,
the `frock` entry in the `scripts` key will allow you to run frock with
`npm run frock` even if your `PATH` isn't set as recommended above.

## Using `frock` with optional packages

`frock` intentionally has a small core and the smallest possible dependency set,
but there are some additional packages that you can use to enhance its
functionality.

### Databases

If the [level][] package is present, you can access a `leveldb` instance(s) in
your plugins. Continuing from the examples above, your `package.json` would look
as follows:

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "description": "My awesome project.",
  "scripts": {
    "frock": "frock"
  },
  "devDependencies": {
    "frock": "^1.0.1",
    "frock-static": "^1.0.0",
    "level": "^1.4.0"
  },
  "dependencies": {}
}
```

Then define a database path in your `package.json`:

```json
{
  "db": {
    "path": "_db"
  },
  "servers": [
    {
      "port": 8080,
      "routes": [
        {
          "path": "/api/",
          "methods": "any",
          "handler": "./mocks/mock-api-handler"
        },
        {
          "path": "*",
          "methods": "any",
          "handler": "frock-static",
          "options": {
            "dir": "./static"
          }
        }
      ]
    }
  ]
}
```

For an example of a plugin that uses a database, see the [db example][].

*Note:* trying to access a database when the `level` or `levelup` packages are
not locally installed will cause an error to be thrown. Not having a database
path defined will similarly throw an error.

### Javascript Compilers/Transpilers

In local mocks—that is, mocks that are in the local project directory—you may
want to write in newer dialects of JavaScript (like ES2015) or TypeScript;
`frock` allows for this, but you'll need to make sure the necessary packages are
present.

For example, a `package.json` including [Babel][babel] for ES2015->ES5
transpiling:

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "description": "My awesome project.",
  "scripts": {
    "frock": "frock"
  },
  "devDependencies": {
    "frock": "^1.0.1",
    "frock-static": "^1.0.0",
    "level": "^1.4.0",
    "babel-cli": "^6.3.17",
    "babel-preset-es2015": "^6.3.13"
  },
  "dependencies": {},
  "babel": {
    "presets": [
      "es2015"
    ]
  }
}
```

You only need to ensure that your local mocks have the correct file extensions;
in the case of Babel you'd use `.babel.js`; for TypeScript, `.ts`.

A full [example using es2015][es2015 example] is provided.

Internally, frock uses [interpret][] to determine how a file should be
transformed (if at all); if [interpret][] doesn't support a transpiler, then
frock won't either.
  
[so]: http://stackoverflow.com/questions/9679932/how-to-use-package-installed-locally-in-node-modules
[run-scripts]: https://docs.npmjs.com/cli/run-script
[node-modules]: https://nodejs.org/api/modules.html
[grunt]: http://www.npmjs.com/packages/grunt
[gulp]: http://www.npmjs.com/packages/gulp
[level]: http://www.npmjs.com/packages/level
[db example]: ./examples/db
[es2015 example]: ./examples/es2015
[babel]: http://babeljs.io
[interpret]: http://npm.im/interpret
