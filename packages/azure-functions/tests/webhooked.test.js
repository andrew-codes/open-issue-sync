jest.mock('@andrew-codes/webhooked');

const webhooked = require('@andrew-codes/webhooked');
const httpFunction = require('../webhooked/index');

const context = require('../testing/defaultContext');
let handle = jest.fn();
beforeEach(() => {
  webhooked.mockReturnValue({
    handle,
  });
});

test('configures webhooked and handles request', async () => {
  const request = {
    headers: {},
    body: { some: 'json' },
  };

  await httpFunction(context, request);

  expect(webhooked).toBeCalledTimes(1);
  expect(handle).toBeCalledWith(request);
  expect(context.res.status).toEqual(200);
});

test('responds with a 500 status on error', async () => {
  const request = {};
  webhooked.mockImplementation(() => {
    throw new Error('failure');
  });
  await httpFunction(context, request);

  expect(context.res.status).toEqual(500);
});
