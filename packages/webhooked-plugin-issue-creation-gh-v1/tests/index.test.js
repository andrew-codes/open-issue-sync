jest
  .mock('@andrew-codes/v1sdk-fetch-connector')
  .mock('v1sdk')
  .mock('github-api');
const { when } = require('jest-when');
const plugin = require('../src/index');
const connector = require('@andrew-codes/v1sdk-fetch-connector');
const github = require('github-api');
const ghEditIssue = jest.fn();
const ghToken = 'ghtoken';
when(github)
  .calledWith({ token: ghToken })
  .mockReturnValue({
    getIssues: jest.fn().mockReturnValue({ editIssue: ghEditIssue }),
  });
const v1Create = jest.fn();
const connectedSdk = jest.fn();
const sdkConstructor = jest.fn();
connectedSdk.mockReturnValue({
  withAccessToken: jest.fn().mockReturnValue({ create: v1Create }),
});
sdkConstructor.mockReturnValue(connectedSdk);
connector.mockReturnValue(sdkConstructor);

test('throws error if required options are not provided', async () => {
  try {
    await plugin(createGhRequest('created'));
  } catch ({ message }) {
    expect(message).toBe('Missing options');
  }
});

test('throws error if when there is no connection information for v1 and/or gh', async () => {
  try {
    await plugin(createGhRequest('created'), {
      connection: {},
      assetToLabel: {},
    });
  } catch (error) {
    expect(error.invalidOptions).toContain('Missing v1 connection option');
    expect(error.invalidOptions).toContain('Missing gh connection option');
  }
});

test('throws error if when there is invalid connection information for v1 and/or gh', async () => {
  try {
    await plugin(createGhRequest('created'), {
      connection: { v1: {}, gh: {} },
      assetToLabel: {},
    });
  } catch (error) {
    expect(error.invalidOptions).toContain(
      'Invalid gh connection token option',
    );
    expect(error.invalidOptions).toContain('Invalid v1 connection host option');
    expect(error.invalidOptions).toContain(
      'Invalid v1 connection instance option',
    );
    expect(error.invalidOptions).toContain('Invalid v1 connection port option');
    expect(error.invalidOptions).toContain(
      'Invalid v1 connection token option',
    );
  }
});

test('throws error if there is an invalid asset to label mapping option', async () => {
  try {
    await plugin(
      createGhRequest('created'),
      createOptionsWithValidConnection(),
    );
  } catch (error) {
    expect(error.invalidOptions).toContain(
      'Invalid Story asset to label mapping value',
    );
    expect(error.invalidOptions).toContain(
      'Invalid Defect asset to label mapping value',
    );
  }
});
test('throws error if there is an invalid scope option', async () => {
  try {
    await plugin(
      createGhRequest('created'),
      createOptionsWithValidConnection(),
    );
  } catch (error) {
    expect(error.invalidOptions).toContain('Invalid scope option');
  }
});

test('labeling a gh issue as a story will create a Story asset V1 in the configured scope, on the configured team, tagged with the gh issue identifier, and a link back to the github issue', async () => {
  const scope = 'Scope:1';
  const name = 'some title';
  const url = 'some url';
  const team = 'Team:102';
  v1Create.mockReturnValue({ _oid: 'Issue:1234' });

  await plugin(
    createGhRequest('labeled', {
      issue: { number: 123, title: name, url },
      label: { name: 'story' },
    }),
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      team,
    }),
  );

  expect(v1Create).toBeCalledWith('Story', {
    links: { name: 'Github Issue', url },
    name,
    scope,
    taggedWith: [`github:${123}`],
    team,
  });
});

test('labeling a gh issue as a defect will create a Defect asset V1 in the configured scope, on the configured team, tagged with the gh issue identifier, and a link back to the github issue', async () => {
  const scope = 'Scope:1';
  const name = 'some title';
  const url = 'some url';
  const team = 'Team:102';
  v1Create.mockReturnValue({ _oid: 'Issue:1234' });

  await plugin(
    createGhRequest('labeled', {
      issue: { number: 123, title: name, url },
      label: { name: 'defect' },
    }),
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      team,
    }),
  );

  expect(v1Create).toBeCalledWith('Defect', {
    links: { name: 'Github Issue', url },
    name,
    scope,
    taggedWith: [`github:${123}`],
    team,
  });
});

function createGhRequest(action, data = {}) {
  return {
    headers: {
      'x-github-event': 'issues',
    },
    body: {
      action,
      ...data,
    },
  };
}
function createOptionsWithValidConnection(data = {}) {
  return {
    connection: {
      v1: {
        host: 'host',
        instance: 'instance',
        port: 443,
        isHttps: true,
        token: 'v1token',
      },
      gh: {
        token: ghToken,
      },
    },
    ...data,
  };
}
