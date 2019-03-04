const fetch = require('node-fetch');
const fetchConnector = require('@andrew-codes/v1sdk-fetch-connector');
const v1sdk = require('v1sdk').default;

module.exports = ({ host, instance, isHttps, port, token }) => {
  return fetchConnector(fetch)(v1sdk)(
    host,
    instance,
    port,
    isHttps,
  ).withAccessToken(token);
};
