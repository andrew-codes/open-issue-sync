const fetch = require('fetch-node');
const fetchConnector = require('@andrew-codes/v1sdk-fetch-connector');
const v1sdk = require('v1sdk').default;
const {
  matchesActions,
} = require('@andrew-codes/webhooked-github-request-matchers');

module.exports = async (
  req,
  {
    connection: { host, instance, port, isHttps, token },
    scope,
    team,
    labelToAsset = {
      story: 'Story',
      bug: 'Defect',
    },
  } = { connection: {} },
) => {
  const requiredOptions = [host, instance, port, isHttps, token];
  if (requiredOptions.includes(null) || requiredOptions.includes(undefined)) {
    throw new Error('Missing required options');
  }
  if (!matchesActions(req, ['labeled'])) {
    return;
  }
  if (Object.keys(labelToAsset).includes(req.body.label.name)) {
    const connectedSdk = fetchConnector(fetch)(v1sdk);
    const v1 = connectedSdk(host, instance, port, isHttps).withAccessToken(
      token,
    );
    return await v1.create(labelToAsset[req.body.label.name], {
      name: req.body.issue.title,
      scope,
      team,
    });
  }
};
