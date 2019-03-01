const { isRequestFromGithub } = require('../src');

test('can determine whether a request is from a github API event', () => {
  const ghRequest = {
    headers: {
      'x-github-event': 'issues',
    },
  };
  expect(isRequestFromGithub(ghRequest)).toBeTruthy();

  const nonGHRequest = {
    headers: {},
  };
  expect(isRequestFromGithub(nonGHRequest)).toBeFalsy();
});
