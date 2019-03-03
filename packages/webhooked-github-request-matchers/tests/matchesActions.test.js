jest.mock('../src/isRequestFromGithub');
const { when } = require('jest-when');
const { matchesActions } = require('../src');
const isRequestFromGithub = require('../src/isRequestFromGithub');
const key = 'key';

test('returns false if the request is not a github api event', () => {
  const nonGHRequest = {
    headers: {},
  };
  when(isRequestFromGithub)
    .calledWith(nonGHRequest, key)
    .mockReturnValue(false);

  expect(matchesActions(nonGHRequest)).toBeFalsy();
});

test('returns false if no actions are provided', () => {
  when(isRequestFromGithub)
    .calledWith(createGHRequest(), key)
    .mockReturnValue(true);
  expect(matchesActions(createGHRequest(), key)).toBeFalsy();
});
test('returns false if the action is not matched', () => {
  when(isRequestFromGithub)
    .calledWith(createGHRequest(), key)
    .mockReturnValue(true);
  expect(matchesActions(createGHRequest(), ['created'], key)).toBeFalsy();
});

test('returns true if the request matches any one of the provided actions', () => {
  when(isRequestFromGithub)
    .calledWith(createGHRequest(), key)
    .mockReturnValue(true);
  expect(
    matchesActions(createGHRequest(), ['created', 'labeled'], key),
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
