# frock

A plugin-based tool for running fake HTTP and socket services.

[![Build Status](http://img.shields.io/travis/urbanairship/frock/master.svg?style=flat-square)](https://travis-ci.org/urbanairship/frock)
[![npm install](http://img.shields.io/npm/dm/frock.svg?style=flat-square)](https://www.npmjs.org/package/frock)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

frock is a tool for running fake services and serving mock data. It's designed
for developers who work in service-oriented architectures, and need to stand up
fake services that approximate production services in their development
environments.

frock itself is a host for running HTTP and socket services, and its HTTP router
makes it simple to run multiple services on the same port. Outside of the core
functions of starting services and routing to handlers, frock's functionality is
implemented through plugins and middleware that you write.

There are some generic plugins provided for out-of-the-box functionality:

- [frock-static][static] is a plugin for serving static content from files,
  directories, or URLs.
- [frock-proxy][proxy] is a plugin for proxying requests from frock to a remote
  server.
  
For a quick overview of the functionality frock provides, see the
[example](#quick-start-example) in this README.

## Quick-Start Example

frock is a Node.js CLI utility, which loads a _frockfile_ from your project
directory. In the following example, we'll create a service that proxies
requests to your local development server at http://localhost:8052, but
intercepts some URLs to serve static content from a variety of sources.

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
            "url": "http://raw.githubusercontent.com/somewhere/something.json",
            "contentType": "application/json"
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

Install frock and the plugins you requested:

```shell
$ npm install frock frock-static frock-proxy
```

Then, run frock:

```shell
$ frock
```

This examples expects that your `PATH` is set to run Node.js packages from your
project's installed `node_modules`; see the [Understanding Packages][packages]
section of the documentation for details.

_Note:_ By default, frock only allows connections from `localhost`; see the
[docs on connection filtering][filtering] for details.

## Detailed Documentation

frock's [documentation](./docs) is split into several sections:

- [Using frock in your project/Understanding Packages][packages] is an overview
  of how frock is meant to sit alongside your project.
- Implementing mocks/fakes:
    - [Plugins][plugins]: writing plugins, where you'll implement your fake
      services.
    - [Middleware][middleware]: writing middleware, which can augment your
      plugins' functionality.
    - [Cores][cores]: writing cores, which can extend the core functionality of
      frock.
- [_frockfile_ Reference][frockfile], which explains the configuration file format
  that frock uses, the `frockfile.json`
- [Examples][examples] which provides detailed examples of using frock, and can
  help you understand how to implement your fake services.
- [API][api] details the frock API, which can be used programatically rather
  than via the provided CLI. This also documents the frock singleton your
  plugins will be passed when they are instantiated.

## CLI

The `frock` command will search upward from your current directory for a
`frockfile.json`, and run it.

Use the built-in help to learn about other options:

```shell
$ frock --help
```

Some options can be set via environment variables; these provide defaults, which
can still be overridden by explicitly passing CLI flags. Set these to any value
besides an empty string to set the default to `true`:

- `FROCK_DEBUG` set the log level to `debug`
- `FROCK_RAW_OUTPUT` output the raw log JSON rather than pretty-printing
- `FROCK_UNSAFE_DISABLE_CONNECTION_FILTERING` disable processing of
  whitelists/blacklists for connections, and allow any incoming connections

## Testing

From the project directory:

```shell
$ npm test
```

Any test file that should be run must be required in the `tests/index.js` file.

## License

Apache 2.0, see [LICENSE](./LICENSE) for details.

[packages]: ./docs/understanding-packages.md
[api]: ./docs/api.md
[cores]: ./docs/cores.md
[plugins]: ./docs/plugins.md
[middleware]: ./docs/middleware.md
[frockfile]: ./docs/frockfile.md
[filtering]: ./docs/frockfile.md#connection-object-optional 
[examples]: ./examples
[static]: http://www.npmjs.com/packages/frock-static
[proxy]: http://www.npmjs.com/packages/frock-proxy
