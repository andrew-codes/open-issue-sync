jest.mock('../testing/testHandler').mock('../testing/testHandler2');

const webhooked = require('../src');
const testHandler = require('../testing/testHandler');
const testHandler2 = require('../testing/testHandler2');

beforeEach(() => {
  testHandler.mockReturnValue(42);
});

test('requests are passed to every handler package module', () => {
  const fakeRequest = { fake: 'request' };
  webhooked({
    handlers: ['../testing/testHandler', '../testing/testHandler2'],
  }).handle(fakeRequest);

  expect(testHandler).toBeCalledWith(fakeRequest);
  expect(testHandler2).toBeCalledWith(fakeRequest);
});
