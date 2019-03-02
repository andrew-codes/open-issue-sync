jest.mock('@andrew-codes/v1sdk-fetch-connector').mock('v1sdk');
const plugin = require('../src/index');
const connector = require('@andrew-codes/v1sdk-fetch-connector');
const v1 = { create: jest.fn() };
const connectedSdk = jest.fn();
const withAccessToken = jest.fn();
const sdkConstructor = jest.fn();
withAccessToken.mockReturnValue(v1);
connectedSdk.mockReturnValue({
  withAccessToken,
});
sdkConstructor.mockReturnValue(connectedSdk);
connector.mockReturnValue(sdkConstructor);

test('throws error if required options are not provided', async () => {
  try {
    await plugin(createRequest('question'));
  } catch ({ message }) {
    expect(message).toBe('Missing required options');
  }
});

test('plugin does not act on issues labeled that do not follow a specified mapping (provided options)', async () => {
  const options = {
    labelToAsset: {
      story: 'Story',
    },
  };
  plugin(createRequest('question'), options);
  expect(v1.create).not.toBeCalled();
});

test('plugin acts on issues labeled that do follow a specified mapping (provided options)', () => {
  const options = {
    labelToAsset: {
      issue: 'Story',
    },
    connection: {
      host: 'host',
      instance: 'instance',
      port: 443,
      isHttps: true,
      token: 'token',
    },
  };
  plugin(createRequest('issue', 'some title'), options);
  expect(v1.create).toBeCalled();
});

test('plugin creates assets in provided scope and team (options)', () => {
  const options = {
    labelToAsset: {
      issue: 'Story',
    },
    connection: {
      host: 'host',
      instance: 'instance',
      port: 443,
      isHttps: true,
      token: 'token',
    },
    scope: 'Scope:1',
    team: 'Team:1',
  };
  plugin(createRequest('issue', 'some title'), options);
  expect(v1.create).toBeCalledWith('Story', {
    name: 'some title',
    scope: options.scope,
    team: options.team,
  });
});

function createRequest(label, title) {
  return {
    headers: {
      'x-github-event': 'issues',
    },
    body: {
      action: 'labeled',
      label: {
        id: 280912117,
        node_id: 'MDU6TGFiZWwyODA5MTIxMTc=',
        url: 'https://api.github.com/repos/user/repo/labels/story',
        name: label,
        color: '207de5',
        default: false,
      },
      issue: {
        title,
      },
    },
  };
}
