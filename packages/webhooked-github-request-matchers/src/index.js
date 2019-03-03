const { createHmac } = require('crypto');

const isRequestFromGithub = (req, hmacKey) =>
  req.headers['x-hub-signature'] ===
  `sha1=${createHmac('sha1', hmacKey)
    .update(JSON.stringify(req.body))
    .digest('hex')}`;

const matchesActions = (req, actions = []) => {
  if (!isRequestFromGithub(req)) {
    return false;
  }
  return Boolean(actions.find(action => req.body.action === action));
};

module.exports.isRequestFromGithub = isRequestFromGithub;
module.exports.matchesActions = matchesActions;
