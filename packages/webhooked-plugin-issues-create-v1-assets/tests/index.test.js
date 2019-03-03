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

test('labeling a gh issue as a story will create a Story asset V1 in the configured scope, on the configured team, tagged with the gh issue identifier, and a link back to the github issue', async () => {
  const scope = 'Scope:1';
  const name = 'some title';
  const url = 'some url';
  const team = 'Team:102';
  const _oid = 'Story:1234';
  const issueNumber = 123;
  const request = createGhRequest('labeled', {
    issue: { number: issueNumber, title: name, url },
    label: { name: 'story' },
  });
  this.v1Create.mockReturnValue({ _oid });
  v1Matcher.isRequestFromV1.mockReturnValue(false);
  when(ghMatcher.matchesActions)
    .calledWith(request, ['labeled'], 'ghKey')
    .mockReturnValue(true);

  await plugin(
    request,
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      team,
      webhookId: 'v1 payload identifier',
    }),
  );

  expect(this.v1Create).toBeCalledWith('Story', {
    links: { name: 'Github Issue', url },
    name,
    scope,
    taggedWith: [`github-${issueNumber}`, 'github'],
    team,
  });
  expect(this.ghEditIssue).toBeCalledWith(issueNumber, {
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
  const request = createGhRequest('labeled', {
    issue: { number: issueNumber, title: name, url },
    label: { name: 'defect' },
  });
  this.v1Create.mockReturnValue({ _oid });
  v1Matcher.isRequestFromV1.mockReturnValue(false);
  when(ghMatcher.matchesActions)
    .calledWith(request, ['labeled'], 'ghKey')
    .mockReturnValue(true);

  await plugin(
    request,
    createOptionsWithValidConnection({
      assetToLabel: { Defect: 'defect', Story: 'story' },
      scope,
      team,
      webhookId: 'v1 payload identifier',
    }),
  );

  expect(this.v1Create).toBeCalledWith('Defect', {
    links: { name: 'Github Issue', url },
    name,
    scope,
    taggedWith: [`github-${issueNumber}`, 'github'],
    team,
  });
  expect(this.ghEditIssue).toBeCalledWith(issueNumber, {
    labels: [`v1-${_oid}`, 'v1'],
  });
});

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
