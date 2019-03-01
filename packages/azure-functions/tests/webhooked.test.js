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
    headers: {
      'x-github-event': 'issues',
    },
    body: { some: 'json' },
  };

  await httpFunction(context, request);

  expect(webhooked).toBeCalledTimes(1);
  expect(handle).toBeCalledWith(request);
  expect(context.res.status).toEqual(200);
});
