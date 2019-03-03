const isRequestFromGithub = require('./isRequestFromGithub');

const matchesActions = (req, actions = [], key = '') => {
  if (!isRequestFromGithub(req, key)) {
    return false;
  }
  return Boolean(actions.find(action => req.body.action === action));
};

module.exports.isRequestFromGithub = isRequestFromGithub;
module.exports.matchesActions = matchesActions;
