module.exports = function(
  subject,
  props,
  validator = val => !!val,
  applyToMessage = p => p,
) {
  return props.filter(p => !validator(subject[p])).map(applyToMessage);
};
