# frock Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [HEAD]

- Removes support for Node.js v4
- Removes babel transpiling in favor of native ES6+ support in the latest
  Node.js versions.

## [3.0.0]

- Removes file watching functionality. This feature has been moved to a core
  plugin, [frock-core-watcher][], which replicates the feature and adds the
  ability to watch files other than the `frockfile`.
    - Removes CLI flag `--nowatch` and env variable `FROCK_NO_WATCH`

## [2.0.0]
- Adds integration test to catch errors, such as those fixed in [1.1.1]
- Removes tests for unsupported versions of Node.js
- Specifies supported engines in `package.json`
- Fixes a bug that would crash frock when using socket servers on versions of
  Node.js greater than v4.

## [1.1.1]
- Fixes a bug that prevented frock from running via the CLI

## [1.1.0]
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
[1.1.0]: https://github.com/urbanairship/frock/compare/v1.0.2...v1.1.0
[1.1.1]: https://github.com/urbanairship/frock/compare/v1.1.0...v1.1.1
[2.0.0]: https://github.com/urbanairship/frock/compare/v1.1.1...v2.0.0
[3.0.0]: https://github.com/urbanairship/frock/compare/v2.0.0...v3.0.0
[HEAD]: https://github.com/urbanairship/frock/compare/v3.0.0...HEAD

[frock-core-watcher]: https://github.com/fardog/frock-core-watcher
