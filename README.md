# Webhooked

Plug-able webhook handler. Primary use case is to sync GitHub issues and VersionOne to enable collaboration with community on open source projects for companies using VersionOne.

> WARNING: under heavy development; not for production use.

## Running Locally

- install node@>=10.15.1
- yarn@^1.3.2
- `yarn && yarn bootstrap`
- `yarn start`; look in console for address
- `yarn test`; runs tests

## Packages Overview

### Webhooked Package

`@andrew-codes/webhooked` is the main NPM package. Webhooked accepts a configuration object with an array of handlers. Each handler is a package or string resolvable to a handler.

### Azure-Functions

This package is meant to use the webhooked package within a FaaS; deployed to Azure. It is a typical Azure Functions project which consumes `@andrew-codes/webhooked`.

### Handler Packages

Handler modules are **async** functions that accept a request object. They are responsible handling/doing something with each received webhook request. Although they receive every request, they are not required to act upon it.

## Adding Dependencies

The project leverages yarn and lerna. To add a new dependency to one of the packages, you can use the command like this:

```shell
yarn lerna add --scope @andrew-codes/pkg-to-add-to pkg-to-add

# add dependencies between local packages
yarn lerna add --scope @andrew-codes/pkg-to-add-to @andrew-codes/pkg-to-add
```
