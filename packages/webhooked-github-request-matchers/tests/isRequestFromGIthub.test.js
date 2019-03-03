const { createHmac } = require('crypto');
const { isRequestFromGithub } = require('../src');

test('can determine whether a request is from a github API event', () => {
  const key = 'hmacKey';
  const body = {
    some: 'payload',
  };
  const ghRequest = {
    headers: {
      'x-hub-signature': `sha1=${createHmac('sha1', key)
        .update(JSON.stringify(body))
        .digest('hex')}`,
    },
    body,
  };
  expect(isRequestFromGithub(ghRequest, key)).toBeTruthy();

  const nonGHRequest = {
    headers: {},
    body,
  };
  expect(isRequestFromGithub(nonGHRequest, key)).toBeFalsy();
});
