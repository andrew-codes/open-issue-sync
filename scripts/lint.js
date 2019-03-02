const shell = require('shelljs');
const updateStatus = require('./updateGHStatus');

const status = {
  description: 'Linting source',
  context: 'Verify/Linting',
};
(async function() {
  await updateStatus({
    ...status,
    state: 'pending',
  });
  const output = shell.exec('yarn lint', { silent: true }).stdout;
  const failedResults = /(\d*) problem/.exec(output) || [null, null];

  const [_failedResult, failed] = failedResults;

  await updateStatus({
    ...status,
    description: failed ? `${failed} failed, ` : 'Passed',
    state: failed ? 'failure' : 'success',
  });
})();
