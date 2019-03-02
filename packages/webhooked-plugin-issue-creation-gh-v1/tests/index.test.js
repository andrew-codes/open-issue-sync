jest
  .mock('@andrew-codes/v1sdk-fetch-connector')
  .mock('v1sdk')
  .mock('github-api');
const { when } = require('jest-when');
const plugin = require('../src/index');
const connector = require('@andrew-codes/v1sdk-fetch-connector');
const github = require('github-api');
const ghCreateIssue = jest.fn();
const ghEditIssue = jest.fn();
const ghToken = 'ghtoken';
when(github)
  .calledWith({ token: ghToken })
  .mockReturnValue({
    getIssues: jest
      .fn()
      .mockReturnValue({ createIssue: ghCreateIssue, editIssue: ghEditIssue }),
  });
const v1Create = jest.fn();
const v1Update = jest.fn();
const connectedSdk = jest.fn();
const sdkConstructor = jest.fn();
connectedSdk.mockReturnValue({
  withAccessToken: jest
    .fn()
    .mockReturnValue({ create: v1Create, update: v1Update }),
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
test('throws error if there is an invalid webhookId option', async () => {
  try {
    await plugin(
      createGhRequest('created'),
      createOptionsWithValidConnection(),
    );
  } catch (error) {
    expect(error.invalidOptions).toContain('Invalid webhookId option');
  }
});

test('labeling a gh issue as a story will create a Story asset V1 in the configured scope, on the configured team, tagged with the gh issue identifier, and a link back to the github issue', async () => {
  const scope = 'Scope:1';
  const name = 'some title';
  const url = 'some url';
  const team = 'Team:102';
  const _oid = 'Story:1234';
  const issueNumber = 123;
  v1Create.mockReturnValue({ _oid });

  await plugin(
    createGhRequest('labeled', {
      issue: { number: issueNumber, title: name, url },
      label: { name: 'story' },
    }),
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      team,
      webhookId: 'v1 payload identifier',
    }),
  );

  expect(v1Create).toBeCalledWith('Story', {
    links: { name: 'Github Issue', url },
    name,
    scope,
    taggedWith: [`github-${issueNumber}`, 'github'],
    team,
  });
  expect(ghEditIssue).toBeCalledWith(issueNumber, {
    labels: [`v1-${_oid}`, 'v1'],
  });
});

test('labeling a gh issue as a defect will create a Defect asset V1 in the configured scope, on the configured team, tagged with the github issue identifier, and a link back to the github issue', async () => {
  const scope = 'Scope:1';
  const name = 'some title';
  const url = 'some url';
  const team = 'Team:102';
  const _oid = 'Defect:1234';
  const issueNumber = 123;
  v1Create.mockReturnValue({ _oid });

  await plugin(
    createGhRequest('labeled', {
      issue: { number: issueNumber, title: name, url },
      label: { name: 'defect' },
    }),
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      team,
      webhookId: 'v1 payload identifier',
    }),
  );

  expect(v1Create).toBeCalledWith('Defect', {
    links: { name: 'Github Issue', url },
    name,
    scope,
    taggedWith: [`github-${issueNumber}`, 'github'],
    team,
  });
  expect(ghEditIssue).toBeCalledWith(issueNumber, {
    labels: [`v1-${_oid}`, 'v1'],
  });
});

test('tagging a Story or Defect already containing a github issue identifier with github will not create a new github issue', async () => {
  const _oid = 'Story:1234';
  const scope = 'scope';
  const webhookId = 'v1 payload identifier';
  const name = 'defect name';
  const description = 'defect description';
  const issueNumber = '4';
  const url = 'issue url';
  ghCreateIssue.mockReturnValue(Promise.resolve({ number: issueNumber, url }));

  await plugin(
    createV1Request('AssetChanged', webhookId, {
      targetAsset: { _oid, assetType: 'Story' },
      changes: [{ name: 'TaggedWith', new: 'github' }],
      snapshot: [
        {
          _oid,
          Name: name,
          Description: description,
          taggedWith: [`github-${issueNumber}`],
        },
      ],
    }),
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      webhookId,
    }),
  );

  expect(ghCreateIssue).not.toBeCalled();
  expect(v1Update).not.toBeCalled();
});

test('tagging a Story, that is not tagged with a github issue identifier, with github will create a new github issue, name it, describe it, label it with the asset oid, and add the created issue identifier to the asset along with a link to the created issue', async () => {
  const _oid = 'Story:1234';
  const scope = 'scope';
  const webhookId = 'v1 payload identifier';
  const name = 'defect name';
  const description = 'defect description';
  const issueNumber = '4';
  const url = 'issue url';
  ghCreateIssue.mockReturnValue(Promise.resolve({ number: issueNumber, url }));

  await plugin(
    createV1Request('AssetChanged', webhookId, {
      targetAsset: { _oid, assetType: 'Story' },
      changes: [{ name: 'TaggedWith', new: 'github' }],
      snapshot: [
        { _oid, Name: name, Description: description, taggedWith: [] },
      ],
    }),
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      webhookId,
    }),
  );

  expect(ghCreateIssue).toBeCalledWith({
    title: name,
    description,
    labels: [`v1-${_oid}`, 'v1'],
  });
  expect(v1Update).toBeCalledWith(_oid, {
    taggedWith: [`github-${issueNumber}`],
    links: { name: 'Github Issue', url },
  });
});

test('V1 payloads with multiple changed assets will create github issues only for those tagged with github and that are not already tagged with a github issue identifier', async () => {
  const _oid = 'Story:1234';
  const scope = 'scope';
  const webhookId = 'v1 payload identifier';
  const name = 'matched asset';
  const description = 'story description';
  const issueNumber = '4';
  const url = 'issue url';
  ghCreateIssue.mockReturnValue(Promise.resolve({ number: issueNumber, url }));

  await plugin(
    createV1Request({
      events: [
        {
          eventType: 'AssetChanged',
          webhookId,
          targetAsset: {
            _oid: 'Defect:12345',
            assetType: 'Defect',
          },
          changes: [{ name: 'Name', new: 'ignored asset' }],
          snapshot: [
            {
              _oid: 'Defect:12345',
              Name: 'ignored asset',
              taggedWith: [],
            },
          ],
        },
        {
          eventType: 'AssetChanged',
          webhookId,
          targetAsset: {
            _oid: _oid,
            assetType: 'Story',
          },
          changes: [
            { name: 'Name', new: 'matched asset' },
            {
              name: 'TaggedWith',
              new: 'github',
            },
          ],
          snapshot: [
            {
              _oid: _oid,
              Name: name,
              Description: description,
              taggedWith: ['github'],
            },
          ],
        },
        {
          eventType: 'AssetChanged',
          webhookId,
          targetAsset: {
            _oid: 'Story:123',
            assetType: 'Story',
          },
          changes: [
            { name: 'Name', new: 'already tracked asset' },
            {
              name: 'TaggedWith',
              new: 'github',
            },
          ],
          snapshot: [
            {
              _oid: 'Defect:12345',
              Name: 'ignored asset',
              taggedWith: ['github', 'github-456'],
            },
          ],
        },
      ],
    }),
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      webhookId,
    }),
  );

  expect(ghCreateIssue).toBeCalledWith({
    title: name,
    description,
    labels: [`v1-${_oid}`, 'v1'],
  });
  expect(v1Update).toBeCalledWith(_oid, {
    taggedWith: [`github-${issueNumber}`],
    links: { name: 'Github Issue', url },
  });
});

test('tagging a Defect, that is not tagged with a github issue identifier, with github will create a new github issue, name it, describe it, label it with the asset oid, and add the created issue identifier to the asset along with a link to the created issue', async () => {
  throw new Error('Not Implemented');
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
function createV1Request(eventType, webhookId, data = {}) {
  return {
    events: [{ eventType, webhookId, ...data }],
  };
}
