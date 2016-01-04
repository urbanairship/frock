# Documentation TOC

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

[api]: ./api.md
[cores]: ./cores.md
[examples]: ../examples
[frockfile]: ./frockfile.md
[middleware]: ./middleware.md
[plugins]: ./plugins.md
[packages]: ./understanding-packages.md
