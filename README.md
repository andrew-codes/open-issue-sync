# Webhooked

Plug-able webhook handler. Primary use case is to sync GitHub issues and VersionOne to enable collaboration with community on open source projects for companies using VersionOne.

> WARNING: under heavy development; not for production use.

## Usage

```shell
npm install @andrew-codes/webhooked
```

### Example

Example using with Azure Functions:

```js
const webhooked = require('andrew-codes/webhooked');

module.exports = async function(context, req) {
  try {
    const responses = await webhooked({
      presets: [],
      plugins: ['@andrew-codes/webhooked-plugin-example'],
    }).handle(req);
    context.log(responses);
    context.res = { status: 200 };
  } catch (errors) {
    context.log(errors);
    context.res = { status: 500 };
  }
};
```

### Config Object

Configuration accepts an array of presets and plugins. Plugin modules are **async** functions that accept a request object. They are responsible handling/doing something with each received webhook request. Although they receive every request, they are not required to act upon it.

Presets are several plugins packaged into a single module. Both may accept options like the below:

```js
webhooked({
  presets: [
    'webhooked-preset-example',
    [
      'webhooked-preset-with-options',
      {
        option: 'values',
      },
    ],
  ],
  plugins: [
    'webhooked-plugin-1',
    [('webhooked-plugin-with-options', { option: 'value' })],
    'webooked-plugin-another-one',
  ],
});
```

## Running Locally

- install node@>=10.15.1
- yarn@^1.3.2
- `yarn && yarn bootstrap`
- `yarn start:express`; express based implementation
- `yarn start:azure`; will start Azure Function locally; look in console for address
- `yarn test`; runs tests
- `yarn lint`

### Environment Variables for `yarn start:*`

{needs content}

## Packages Overview

### Webhooked Package

`@andrew-codes/webhooked` is the main NPM package. Webhooked accepts a configuration object with an array of plugins. Each plugin is a package or string resolvable to a plugin.

### Azure-Functions

This package is meant to use the webhooked package within a FaaS; deployed to Azure. It is a typical Azure Functions project which consumes `@andrew-codes/webhooked`.

### Plugin Packages

Plugin modules are **async** functions that accept a request object. They are responsible handling/doing something with each received webhook request. Although they receive every request, they are not required to act upon it.

## Adding Dependencies

The project leverages yarn and lerna. To add a new dependency to one of the packages, you can use the command like this:

```shell
yarn lerna add --scope @andrew-codes/pkg-to-add-to pkg-to-add

# add dependencies between local packages
yarn lerna add --scope @andrew-codes/pkg-to-add-to @andrew-codes/pkg-to-add
```
