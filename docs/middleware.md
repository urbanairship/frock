# Middlewares

Middleware in frock is a special type of frock plugin; the requirements are
basically the same, but what needs to be called at the end varies. A minimal
middleware example:

## Example

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

## Notes

- Middleware is currently only available for HTTP mocks.
- Middleware is always called in the order it's defined in your
  `frockfile.json`, and can be either a local path to a module, or a `npm`
  installed module, same as a `frock` plugin
- There is an internal [utility middleware][] that is _always_ added to your
  routes; it adds convenience functions such as `res.json` and handles some
  logging for all requests.
  
[utility middleware]: ./plugins.md#response-convenience-functions
