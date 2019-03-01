module.exports.isRequestFromGithub = req => {
  return Boolean(req.headers['x-github-event']);
};
