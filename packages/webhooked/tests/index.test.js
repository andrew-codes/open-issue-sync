jest.mock('../testing/testPlugin').mock('../testing/testPlugin2');

const webhooked = require('../src');
const testHandler = require('../testing/testPlugin');
const testHandler2 = require('../testing/testPlugin2');

test('requests are passed to every plugin package module', async () => {
  const fakeRequest = { fake: 'request' };
  await webhooked({
    plugins: ['../testing/testPlugin', '../testing/testPlugin2'],
  }).handle(fakeRequest);

  expect(testHandler).toBeCalledWith(fakeRequest);
  expect(testHandler2).toBeCalledWith(fakeRequest);
});

test('options can be provided which will be provided to plugins', async () => {
  const fakeRequest = { fake: 'request' };
  const options = { someOption: 'value' };
  await webhooked({
    plugins: ['../testing/testPlugin', ['../testing/testPlugin2', options]],
  }).handle(fakeRequest);

  expect(testHandler2).toBeCalledWith(fakeRequest, options);
});
