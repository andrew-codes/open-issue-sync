const { InvalidOptionsError } = require('../src');

test('Error includes stack trace when thrown', () => {
  try {
    throw new InvalidOptionsError(['this is invalid']);
  } catch ({ stack }) {
    expect(stack).toBeDefined();
  }
});
test('Error message indicates that options are required in the case there are no invalid options provided', () => {
  try {
    throw new InvalidOptionsError();
  } catch ({ message }) {
    expect(message).toBe('Missing options');
  }
});

test('Error includes appropriate message', () => {
  try {
    throw new InvalidOptionsError(['this is invalid', 'this is also invalid']);
  } catch ({ message }) {
    expect(message).toBe(
      'Options Error: this is invalid, this is also invalid',
    );
  }
});

test('Error contains additional messages for each invalid option', () => {
  try {
    throw new InvalidOptionsError(['this is invalid']);
  } catch ({ invalidOptions }) {
    expect(invalidOptions).toContain('this is invalid');
  }
});
