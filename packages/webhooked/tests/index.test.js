jest.mock('../testing/testHandler').mock('../testing/testHandler2');

const webhooked = require('../src');
const testHandler = require('../testing/testHandler');
const testHandler2 = require('../testing/testHandler2');

test('requests are passed to every handler package module', async () => {
  const fakeRequest = { fake: 'request' };
  await webhooked({
    handlers: ['../testing/testHandler', '../testing/testHandler2'],
  }).handle(fakeRequest);

  expect(testHandler).toBeCalledWith(fakeRequest);
  expect(testHandler2).toBeCalledWith(fakeRequest);
});

test('options can be provided which will be provided to handlers', async () => {
  const fakeRequest = { fake: 'request' };
  const options = { someOption: 'value' };
  await webhooked({
    handlers: ['../testing/testHandler', ['../testing/testHandler2', options]],
  }).handle(fakeRequest);

  expect(testHandler2).toBeCalledWith(fakeRequest, options);
});
