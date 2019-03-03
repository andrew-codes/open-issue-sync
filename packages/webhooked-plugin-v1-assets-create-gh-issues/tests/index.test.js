jest
  .mock('@andrew-codes/v1sdk-fetch-connector')
  .mock('v1sdk')
  .mock('github-api')
  .mock('@andrew-codes/webhooked-github-request-matchers')
  .mock('@andrew-codes/webhooked-v1-request-matchers');
const { when } = require('jest-when');
const plugin = require('../src/index');
const connector = require('@andrew-codes/v1sdk-fetch-connector');
const ghMatcher = require('@andrew-codes/webhooked-github-request-matchers');
const v1Matcher = require('@andrew-codes/webhooked-v1-request-matchers');
const github = require('github-api');

beforeEach(() => {
  jest.resetAllMocks();
  this.ghCreateIssue = jest.fn();
  this.ghEditIssue = jest.fn();
  github.mockImplementation(({ token }) => {
    if (token === 'ghToken') {
      return {
        getIssues: jest.fn().mockReturnValue({
          createIssue: this.ghCreateIssue,
          editIssue: this.ghEditIssue,
        }),
      };
    }
  });
  this.v1Create = jest.fn();
  this.v1Update = jest.fn();
  this.sdkConstructor = jest.fn();
  this.withAccessToken = jest.fn();
  when(this.withAccessToken)
    .calledWith('v1token')
    .mockReturnValue({ create: this.v1Create, update: this.v1Update });
  this.connectedSdk = jest.fn().mockReturnValue({
    withAccessToken: this.withAccessToken,
  });
  this.sdkConstructor.mockReturnValue(this.connectedSdk);
  connector.mockReturnValue(this.sdkConstructor);
});

test('throws error if required options are not provided', async () => {
  try {
    await plugin(createGhRequest('created'));
  } catch ({ message }) {
    expect(message).toBe('Missing options');
  }
  try {
    await plugin(createGhRequest('created'), {});
  } catch ({ invalidOptions }) {
    expect(invalidOptions).toContain('Missing connection option');
  }
  try {
    await plugin(createGhRequest('created'), { connection: {} });
  } catch (error) {
    expect(error.invalidOptions).toContain('Missing v1 connection option');
    expect(error.invalidOptions).toContain('Missing gh connection option');
  }
  try {
    await plugin(createGhRequest('created'), {
      connection: { v1: {}, gh: {} },
    });
  } catch (error) {
    expect(error.invalidOptions).toContain(
      'Invalid gh connection token option',
    );
    expect(error.invalidOptions).toContain(
      'Invalid gh connection hmacKey option',
    );
    expect(error.invalidOptions).toContain('Invalid v1 connection host option');
    expect(error.invalidOptions).toContain(
      'Invalid v1 connection instance option',
    );
    expect(error.invalidOptions).toContain('Invalid v1 connection port option');
    expect(error.invalidOptions).toContain(
      'Invalid v1 connection token option',
    );
    expect(error.invalidOptions).toContain(
      'Invalid v1 connection hmacKey option',
    );
    expect(error.invalidOptions).toContain(
      'Invalid Story asset to label mapping value',
    );
    expect(error.invalidOptions).toContain(
      'Invalid Defect asset to label mapping value',
    );
    expect(error.invalidOptions).toContain('Invalid scope option');
  }
});

test('tagging a Story or Defect already containing a github issue identifier with github will not create a new github issue', async () => {
  const _oid = 'Story:1234';
  const scope = 'scope';
  const webhookId = 'v1 payload identifier';
  const name = 'defect name';
  const description = 'defect description';
  const issueNumber = '4';
  const url = 'issue url';
  const request = createV1Request('AssetChanged', webhookId, {
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
  });
  this.ghCreateIssue.mockReturnValue(
    Promise.resolve({ number: issueNumber, url }),
  );
  when(v1Matcher.isRequestFromV1)
    .calledWith(request, 'v1Key')
    .mockReturnValue(true);
  ghMatcher.matchesActions.mockReturnValue(false);

  await plugin(
    request,
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      webhookId,
    }),
  );

  expect(this.ghCreateIssue).not.toBeCalled();
  expect(this.v1Update).not.toBeCalled();
});

test('tagging a Story or Defect, that is not tagged with a github issue identifier, with github will create a new github issue, name it, describe it, label it with the asset oid, and add the created issue identifier to the asset along with a link to the created issue', async () => {
  const _oid = 'Story:12345';
  const scope = 'scope';
  const webhookId = 'v1 payload identifier';
  const name = 'defect name';
  const description = 'story description';
  const issueNumber = '4';
  const url = 'issue url';
  const request = createV1Request('AssetChanged', webhookId, {
    targetAsset: { _oid, assetType: 'Story' },
    changes: [{ name: 'TaggedWith', new: 'github' }],
    snapshot: [
      {
        _oid,
        Name: name,
        Description: description,
        taggedWith: ['github'],
      },
    ],
  });
  this.ghCreateIssue.mockReturnValue(
    Promise.resolve({ number: issueNumber, url }),
  );
  when(v1Matcher.isRequestFromV1)
    .calledWith(request, 'v1Key')
    .mockReturnValue(true);
  ghMatcher.matchesActions.mockReturnValue(false);

  await plugin(
    request,
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      webhookId,
    }),
  );

  expect(this.ghCreateIssue).toBeCalledWith({
    title: name,
    description,
    labels: [`v1-${_oid}`, 'v1'],
  });
  expect(this.v1Update).toBeCalledWith(_oid, {
    taggedWith: ['github', `github-${issueNumber}`],
    links: [{ name: 'Github Issue', url }],
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
  const request = {
    body: {
      events: [
        {
          eventType: 'AssetCreated',
          webhookId,
          targetAsset: {
            _oid: 'Defect:1',
            assetType: 'Defect',
          },
          changes: [{ name: 'Name', new: 'ignored asset' }],
          snapshot: [
            {
              _oid: 'Defect:1',
              Name: 'ignored asset',
              taggedWith: [],
            },
          ],
        },
        {
          eventType: 'AssetChanged',
          webhookId,
          targetAsset: {
            _oid: 'Defect:2',
            assetType: 'Defect',
          },
          changes: [{ name: 'Name', new: 'ignored asset' }],
          snapshot: [
            {
              _oid: 'Defect:2',
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
              _oid,
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
            _oid: 'Story:11',
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
              _oid: 'Story:11',
              Name: 'ignored asset',
              taggedWith: ['github', 'github-456'],
            },
          ],
        },
      ],
    },
  };
  this.ghCreateIssue.mockReturnValue(
    Promise.resolve({ number: issueNumber, url }),
  );
  when(v1Matcher.isRequestFromV1)
    .calledWith(request, 'v1Key')
    .mockReturnValue(true);

  await plugin(
    request,
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      webhookId,
    }),
  );

  expect(this.ghCreateIssue).toBeCalledWith({
    title: name,
    description,
    labels: [`v1-${_oid}`, 'v1'],
  });
  expect(this.v1Update).toBeCalledWith(_oid, {
    taggedWith: ['github', `github-${issueNumber}`],
    links: [{ name: 'Github Issue', url }],
  });
});

function createV1Request(eventType, webhookId, data = {}) {
  return {
    body: {
      events: [{ eventType, webhookId, ...data }],
    },
  };
}

function createGhRequest(action, data = {}) {
  return {
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
        hmacKey: 'v1Key',
        host: 'host',
        instance: 'instance',
        port: 443,
        isHttps: true,
        token: 'v1token',
      },
      gh: {
        hmacKey: 'ghKey',
        token: 'ghToken',
      },
    },
    ...data,
  };
}
