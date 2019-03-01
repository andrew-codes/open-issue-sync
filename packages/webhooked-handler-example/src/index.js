module.exports = (req, log) =>
  new Promise((resolve, reject) => {
    resolve(req.headers['x-github-event']);
  });
