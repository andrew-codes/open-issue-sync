const { matchesActions } = require('../src');

test('returns false if the request is not a github api event', () => {
  const nonGHRequest = {
    headers: {},
  };
  expect(matchesActions(nonGHRequest)).toBeFalsy();
});

test('returns false if not actions are provided', () => {
  expect(matchesActions(createGHRequest())).toBeFalsy();
});
test('returns false if the action is not matched', () => {
  expect(matchesActions(createGHRequest(), ['created'])).toBeFalsy();
});

test('returns true if the request matches any one of the provided actions', () => {
  expect(
    matchesActions(createGHRequest(), ['created', 'labeled']),
  ).toBeTruthy();
});

function createGHRequest() {
  return {
    headers: {
      'x-github-event': 'issues',
    },
    body: {
      action: 'labeled',
    },
  };
}
