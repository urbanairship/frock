# Code of Conduct

We want to keep our project open and inclusive. We ask that before you
contribute, you read and follow our [Code of Conduct][code-of-conduct].

# Submitting Issues

Before submitting a new issue, please search the [existing issues][issues].

When submitting bug reports, please include as many details as you can. A good
bug report should include:

- Why the behavior you're seeing qualifies as a bug
- Detailed steps to reproduce the bug, in as minimal of a test case as possible 
- What steps you've taken toward resolving the bug
- Information about the environment in which you're seeing the bug (nodejs,
  browserify) and which browsers if it's a browser-specific bug.

# Creating Pull Requests

- Make minimal changes. PRs should be per-feature or per-issue
- Make minimal commits. Squash commits to a single commit before submitting
  your PR.
- Follow the existing coding style; see [Javascript Standard Style][standard]
  for more information.
- Do not break existing tests
- Write tests for features you add, or bugs you fix
- When submitting your PR, be sure to describe what your PR does, why, and what
  open issues it addresses, if any
- Do not bump the `package.json` version; the maintainers will determine when
  to bump versions and release
- If a change requires the addition of a new dependency, [open an issue][issues]
  first to discuss with the maintainers

# Licensing

All contributions are covered under the Apache License, Version 2.0. See
[LICENSE][license] for details.

[code-of-conduct]: ./CODE_OF_CONDUCT.md
[license]: ./LICENSE
[issues]: https://github.com/urbanairship/frock/issues/
[standard]: http://standardjs.com/
