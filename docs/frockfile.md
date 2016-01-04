# frockfile

A frockfile, which is canonically named `frockfile.json` is the configuration
file that is used by frock to start the services you've defined.

It is a JSON file, defined in the following format:

```
{
  "connection": connection_object,
  "db": database_config_object,
  "servers": [server_config_objects],
  "sockets": [socket_config_objects]
}
```

## Connection Object (optional)

The connection object defines a whitelist or blacklist of IPv4 and IPv6
addresses, which are used to allow/deny connections to all frock services.

If you don't provide a whitelist or blacklist, a default whitelist is provided:
`["127.0.0.1", "::1"]`.

You cannot provide both a whitelist and a blacklist, only one or the other:

```
{
  "whitelist": ["ip_address_or_cidr_string"],
  "blacklist": ["ip_address_or_cidr_string"]
}
```

## Database Config Object (optional)

The configuration used by the database:

```
{
  "path": "path/to/database/storage/directory"
}
```

## Server Config Object (optional)

Servers are your defined HTTP services; they define multiple services and
handlers, which each sit at a path mount point. You can also define per-server
middlewares.

```
{
  "port": port_integer,
  "routes": [route_config_object],
  "middleware": [middleware_config_object]
}
```

### Route Config Object

If you have configured a server, you must define at least one route. Routes can
also define per-route middlewares.

```
{
  "path": "/url/path/to/mount",
  "methods": [method],
  "handler": "handler-name",
  "options": options_object
}
```

#### Methods

Methods can be any of the following: GET, POST, PUT, PATCH, DELETE

You can also use "any" as a shortcut for _all_ methods.

#### Handler

The handler is resolved using the resolution process described in the
[understanding packages][packages] section. These are strings similar to what
you'd pass to a `require` call in Node.js; for example:

- `my-handler` is a plugin that's installed into `node_modules`
- `./path/to/handler` is a plugin that's locally available from the current
  working directory at `./path/to/handler.js`
  
#### Options (optional)

The optional hash of options that'll be passed to the plugin's initialization
function; these options are plugin specific, so you'll be looking to a specific
plugin's documentation to know what to put into this hash.

## Socket Config Object (optional)

```
{
  "port": port_integer,
  "handler": "handler-name",
  "options": options_object
}
```

The [handler](#handler) and [options](#options-optional) are the same as
described for HTTP mocks above.

## Full Example

An example `frockfile.json` below shows most all of frock's features in one
file:

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
              "handler": "./middlewares/occasionally-500",
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
      "options": {
        "responseType": 10
      }
    }
  ]
}
```

[packages]: ./understanding-packages.md
