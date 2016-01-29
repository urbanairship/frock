# frock Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [HEAD]
- Adds a CLI flag `--unsafe-disable-connection-filtering` for bypassing
  connection filtering (a.k.a the default whitelist)
- Improves documentation for connection filtering (whitelisting/blacklisting)
- Adds environment variables that can be used in place of CLI flags:
    - `FROCK_NO_WATCH` disable watching the frockfile to reload changes
    - `FROCK_DEBUG` set the log level to `debug`
    - `FROCK_RAW_OUTPUT` output the raw log JSON rather than pretty-printing
    - `FROCK_UNSAFE_DISABLE_CONNECTION_FILTERING` disable processing of
      whitelists/blacklists for connections, and allow any incoming connections

## [1.0.1] - 2015-12-25
- First public release

[0.1.0]: https://github.com/urbanairship/frock/compare/v0.0.5...v0.1.0
[0.1.1]: https://github.com/urbanairship/frock/compare/v0.1.0...v0.1.1
[0.1.2]: https://github.com/urbanairship/frock/compare/v0.1.1...v0.1.2
[0.2.0]: https://github.com/urbanairship/frock/compare/v0.1.2...v0.2.0
[0.2.1]: https://github.com/urbanairship/frock/compare/v0.2.0...v0.2.1
[0.3.0]: https://github.com/urbanairship/frock/compare/v0.2.1...v0.3.0
[1.0.0]: https://github.com/urbanairship/frock/compare/v0.3.0...v1.0.0
[1.0.1]: https://github.com/urbanairship/frock/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/urbanairship/frock/compare/v1.0.1...v1.0.2
[HEAD]: https://github.com/urbanairship/frock/compare/v1.0.2...HEAD
