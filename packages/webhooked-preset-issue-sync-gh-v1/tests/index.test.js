jest
  .mock('@andrew-codes/webhooked-plugin-issues-create-v1-assets')
  .mock('@andrew-codes/webhooked-plugin-v1-assets-create-gh-issues');
const preset = require('../src/index');
const issuesCreateV1Assets = require('@andrew-codes/webhooked-plugin-issues-create-v1-assets');
const v1AssetsCreateGhIssues = require('@andrew-codes/webhooked-plugin-issues-create-v1-assets');

test('preset leverages plugins by passing requst and options to each one', async () => {
  const req = {
    body: {},
  };
  const options = { key: 'value' };
  await preset(req, options);
  expect(issuesCreateV1Assets).toBeCalledWith(req, options);
  expect(v1AssetsCreateGhIssues).toBeCalledWith(req, options);
});
