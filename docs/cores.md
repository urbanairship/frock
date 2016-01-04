# Cores

Cores in frock are another special type of frock plugin; they can do anything,
and have access to the core `frock` but they will _never_ be restarted once
loaded; cores are used to provide control functions to frock, an example might
be a listener that reloads frock when it receives a POST to its interface:

## Example

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
    "frock": "0.0.3"
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
