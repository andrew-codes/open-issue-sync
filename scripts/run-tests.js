const shell = require('shelljs');
const updateStatus = require('./updateGHStatus');

const status = {
  description: 'Running unit tests',
  context: 'Verify/Testing',
};
(async function() {
  await updateStatus({
    ...status,
    state: 'pending',
  });
  const output = shell.exec('yarn test', { silent: true }).stderr;
  const passedResults = /Tests:.*(\d) passed/.exec(output) || [null, 'N/A'];
  const failedResults = /Tests: *(\d) failed/.exec(output) || [null, null];

  const [_passedResult, passed] = passedResults;
  const [_failedResult, failed] = failedResults;
  console.log(passed);
  await updateStatus({
    ...status,
    description: `${failed ? `${failed} failed, ` : ''}${passed} passed`,
    state: failed ? 'failure' : 'success',
  });
})();
