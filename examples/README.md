# Examples

`frock` is a plugin-based system; in order to make it do anything other than
start services, you'll need to create a frock plugin.

If you're interested stricly in the documentation for the plugin API, take a
look at the [plugins docs](../plugins.md).

## Hello World Example

A "hello world" HTTP plugin would look as follows:

```javascript
// file ./hello-world.js

module.exports = createPlugin

function createPlugin (frock, logger, options) {
  return handler

  function handler (req, res) {
    res.end('hello world!')
  }
}
```

You would include this plugin in your frockfile as follows:

```json
{
  "servers": [
    {
      "port": 8080,
      "routes": [
        {
          "path": "*",
          "methods": ["GET"],
          "handler": "./hello-world"
        }
      ]
    }
  ]
}
```

When frock is run, any request you make to `http://localhost:8080/` will result
in the message "hello world!". You can run this example youself; it's included
in the [example][hello-world] directory in this repository.

To run it, ensure that you've installed the modules by changing to the directory
and running an `npm install`. Then run `frock` in the
[hello world example directory][hello-world] to start a server on port `8080`
which is running the example.

You'll note that when you make a request against the newly written plugin, the
frock process in which it's running will log the request for you; you get this
free with frock's default logging middleware.

You can always add your own log messages, and they'll be displayed in addition
to the default log messages.

## Logging Example

Take a look at the [logging example][logging-example]; we won't reproduce the
code here, but you'll note a few messages being logged to different log levels;
run it with `frock` in the directory, and visit `http://localhost:8080/` and
you'll see the following messages:

```
 info frock/core-httpsever: started server 8080
 info ./logging:8080>: sending hello world message!
 warn ./logging:8080>: this is a very contrived example
 info ./logging:8080>: GET[200] /
```

This reveals a few things about the frock logger:

- The name of the current plugin and port is automatically filled for you as
  `./logging:8080`; this helps you to differentiate where a log message is
  coming from.
- The debug message is missing! Like you might expect, debug messages aren't
  displayed by default. To see them, run your frockfile with `frock --debug`;
  you'll see your debug message (as well as some internal to frock)
- The default logging middleware will run after your response is ended, and any
  other synchronous code in your handler function is run.

Lets start it with `--debug` to see some of the other output; with a
`frock --debug`:

```
debug frock/register-config: using default whitelist
debug frock/register-config: using new configuration
debug frock/core-socketserver: could not locate a project-local package.json
debug frock/middleware: initializing non-required middleware
debug frock/register-handler: registered handler ./logging
debug ./logging:8080>: returning handler
debug frock/middleware: initializing non-required middleware
debug frock/core-httpsever: added route [get:./logging] *
 info frock/core-httpsever: started server 8080
debug ./logging:8080>: GET[INCOMING] /
 info ./logging:8080>: sending hello world message!
 warn ./logging:8080>: this is a very contrived example
 info ./logging:8080>: GET[200] /
```

Now you'll see a number of things, including your own `returning handler` debug
message. Running frock in debug mode can be very helpful when you're developing
your plugins.

## Routing

frock's internal routing is based on [commuter][], which is a wrapper for
[routes][] that understands sub-routes; that is, it's possible to mount new
sub-routers under a parent router, but the sub-routers don't need any special
knowlege of the parent to work correctly. It's this feature that makes writing
routes in frock much simpler and more re-usable.

If you're looking for any specific information on how to do route matching,
looking at [routes][] documentation is recommended; it has a complete list of
features that the route pattern matching supports.

It's important to note however: frock doesn't _require_ you to use its internal
router in your plugins—you're free to implement whatever router you see fit, but
the internal router is available for you to use (and will probably be the most
pleasant and simple to implement).

Although frock uses [commuter][], it's best to use the router factory that is
provided on the [frock-singleton][]; this ensures that your version of the
package matches frock's, so there are no bugs and incompatibilities between
versions—frock follows semver closely, and will not introduce a newly
incompatible version of commuter without a major version bump to frock.

The following routing examples are available:

### Routing in the frockfile

The frockfile uses [routes][] pattern-matching to define which handler should
take care of a particular request, as well as matching against the HTTP method
that the request was made with. The
[routing in the frockfile example][frockfile-routing] shows how to set up
multiple routes in your frockfile, as well as a fallback route to handle all
other requests.

In this [example][frockfile-routing] you'll see that the `respond-with-message`
plugin simply responds to any request with the message that was configured for
it in the options hash.

### Sub-routes in your plugins

The [sub-routes][] example shows you how to create a plugin that is mounted
under a path in your frockfile, and handle all requests in the plugin as though
it were the top-level router. This example is the most common implementation
pattern for a frock plugin, and should show you how to handle common cases
using frock's router.

In the [example][sub-routes], we mount a module that responds to an index page,
and routes `/one` and `/two` under two different mount points. In your browser,
visit `http://localhost:8080/mount-a/` and `http://localhost:8080/mount-b/`;
you'll see the index page for each. Then under each, visit `/one` and `/two`;
you'll see those pages. Note that the plugin has no knowledge of where its
mounted; it simply handles the routes as though it were the top-level router.

In that example, any route other than the ones above will 404, since no
catch-all route was defined.

### Capturing URL Parameters

The [url-parameters][] example shows how you can capture a parameter in your
URLs as defined in your frockfile or in a plugin route. A route parameter is as
follows:

- `/people/:id`, would match things like `/people/1` or `/people/miki`
- `/people/:name/family` would match things like `/people/dave/family` and
  `/people/miki/family`
- You can also match multiples like `/people/:name/:item`, which would match
  `/people/miki/games` and `/people/miki/documents`
  
When you define these sorts of patterns, the captures parameters will be
available on the `request.params` hash; so for the example
`/people/:name/:item` matching `/people/miki/games` would have a `req.params`
object as follows:

```json
{
  "name": "miki",
  "item": "games"
}
```

You can access these in your routes as necessary.

The [example][url-parameters] shows how you can use this in your plugins.

**Note:** if you attempt to capture an identically named parameter in a route
and then again in a sub-route, your sub-route's parameter will overwrite any
earlier routes. The latest-defined parameter always takes precedence.

## Middlewares

In lieu of an in-repo example, there is a simple [delay-middleware][] available;
its [code][delay-github] is a straightforward example of how to write
middlewares. You would use this in your frockfile as follows:

```json
{
  "servers": [
    {
      "port": 8080,
      "routes": [
        {
          "path": "/api",
          "methods": ["GET"],
          "handler": "./some-handler",
          "middleware": [
            {
              "handler": "frock-middleware-delay",
              "options": {
                "min": 1000,
                "max": 1500
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Transpiled Modules, ES2015

frock can support compiling/transpiling of modules, given the appropriate
packages are installed. Internally it uses [interpret][], so the only packages
it will support are those that interpret supports.

To see how this works, look at the [ES2015][es2015-example]; this example uses
[Babel][babel] to compile an ES2015 file into ES5 before running.

Take special note of the [package.json](./es2015/package.json) which shows you
the required packages, and note that the file has a `.babel.js` extension;
without this, the transpilation won't occur, and will fail to load.

## Databases

frock has the ability to manage [level][] databases to provide persistence in
your plugins. The required packages aren't built in however, so you'll need to
install the required modules locally.

See the [database example][db-example] to see how you can use a persistent db
in your projects.

[hello-world]: ./hello-world
[logging-example]: ./logging
[interpret]: https://www.npmjs.com/packages/interpret
[es2015-example]: ./es2015
[babel]: https://babeljs.io
[db-example]: ./db
[frockfile-routing]: ./routing-in-the-frockfile
[frock-singleton]: ../api.md
[commuter]: https://www.npmjs.com/packages/commuter
[routes]: https://www.npmjs.com/packages/routes
[sub-routes]: ./routing-sub-routes
[url-parameters]: ./routing-url-parameters
[delay-middleware]: https://www.npmjs.com/packages/frock-middleware-delay
[delay-github]: https://github.com/urbanairship/frock-middleware-delay
