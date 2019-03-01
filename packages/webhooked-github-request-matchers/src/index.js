const isRequestFromGithub = req => {
  return Boolean(req.headers['x-github-event']);
};

const matchesActions = (req, actions = []) => {
  if (!isRequestFromGithub(req)) {
    return false;
  }
  return Boolean(actions.find(action => req.body.action === action));
};

module.exports.isRequestFromGithub = isRequestFromGithub;
module.exports.matchesActions = matchesActions;
