module.exports = createPlugin

function createPlugin (frock, logger, options, db) {
  return handler

  function handler (req, res) {
    // very very contrived example
    if (req.url !== '/') {
      return res.e404()
    }

    var data = {
      count: 0
    }

    db.get('data', function (err, result) {
      if (err && err.notFound) {
        logger.info('record not found, will create...')
      } else if (err) {
        return res.error(err)
      } else {
        data = result
      }

      ++data.count

      db.put('data', data, function (err) {
        if (err) {
          return res.error(err)
        }
        res.end('count is: ' + data.count)
      })
    })
  }
}
