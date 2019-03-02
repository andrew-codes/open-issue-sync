const validateObjectProps = require('./validateObjectProps');
const { isString, isNumber } = require('lodash');

module.exports.InvalidOptionsError = require('./InvalidOptionsError');
module.exports.validateObjectProps = validateObjectProps;
module.exports.validatePropsAreStrings = (subject, props, applyMessage) =>
  validateObjectProps(subject, props, isString, applyMessage);
module.exports.validatePropsAreNumeric = (subject, props, applyMessage) =>
  validateObjectProps(subject, props, isNumber, applyMessage);
module.exports.validatePropsExists = (subject, props, applyMessage) =>
  validateObjectProps(subject, props, undefined, applyMessage);
