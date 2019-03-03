const { createHmac } = require('crypto');
const { isRequestFromV1 } = require('../src');

test('can determine whether a request is from a v1 webhook event', () => {
  const body = { some: 'payload' };
  const key = 'some hmac key';
  const v1Request = {
    headers: {
      'x-v1-signature': createHmac('sha1', key)
        .update(JSON.stringify(body))
        .digest('hex'),
    },
    body,
  };
  expect(isRequestFromV1(v1Request, key)).toBeTruthy();

  const nonV1Request = {
    headers: {},
    body: body,
  };
  expect(isRequestFromV1(nonV1Request, key)).toBeFalsy();
});
