const {
  validatePropsAreNumeric,
  validatePropsAreStrings,
  validatePropsExists,
  validateObjectProps,
} = require('../src');

test('validateObjectProps returns array of messages created by applyMessage and any property of subject that returns false from the validator', () => {
  const subject = {
    prop1: 'value',
  };
  expect(
    validateObjectProps(subject, ['prop2'], val => !!val, p => `invalid ${p}`),
  ).toContain('invalid prop2');
});

test('can validate numeric props', () => {
  const subject = {
    prop1: 'value',
  };
  expect(
    validatePropsAreNumeric(subject, ['prop1'], p => `invalid ${p}`),
  ).toContain('invalid prop1');
});

test('can validate string props', () => {
  const subject = {
    prop1: 1,
  };
  expect(
    validatePropsAreStrings(subject, ['prop1'], p => `invalid ${p}`),
  ).toContain('invalid prop1');
});

test('can validate props exist', () => {
  const subject = {
    prop2: 1,
  };
  expect(
    validatePropsExists(subject, ['prop1'], p => `invalid ${p}`),
  ).toContain('invalid prop1');
});
