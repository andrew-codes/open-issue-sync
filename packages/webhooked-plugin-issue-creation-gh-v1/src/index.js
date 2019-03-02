const fetch = require('fetch-node');
const fetchConnector = require('@andrew-codes/v1sdk-fetch-connector');
const GitHub = require('github-api');
const v1sdk = require('v1sdk').default;
const { isEmpty } = require('lodash');
const {
  matchesActions,
} = require('@andrew-codes/webhooked-github-request-matchers');
const {
  InvalidOptionsError,
  validatePropsAreNumeric,
  validatePropsAreStrings,
  validatePropsExists,
} = require('@andrew-codes/webhooked-utils');

module.exports = async (req, options) => {
  ensureOptionsAreValid(options);
  const { scope, team } = options;
  const { v1, gh } = options.connection;
  const connectedSdk = fetchConnector(fetch)(v1sdk);
  const v1api = connectedSdk(
    v1.host,
    v1.instance,
    v1.port,
    v1.isHttps,
  ).withAccessToken(v1.token);
  const ghApi = new GitHub({ token: gh.token });
  const issues = ghApi.getIssues();
  if (matchesActions(req, ['labeled'])) {
    const matchedAssetLabelMapping = Object.entries(options.assetToLabel).find(
      mapping => {
        const [_, value] = mapping;
        return value === req.body.label.name;
      },
    );
    if (isEmpty(matchedAssetLabelMapping)) {
      return;
    }
    const assetType = matchedAssetLabelMapping[0];
    const { _oid } = await v1api.create(assetType, {
      links: { name: 'Github Issue', url: req.body.issue.url },
      name: req.body.issue.title,
      scope,
      taggedWith: [`github-${req.body.issue.number}`, 'github'],
      team,
    });
    issues.editIssue(req.body.issue.number, { labels: [`v1-${_oid}`, 'v1'] });
    return;
  }
};

function ensureOptionsAreValid(options) {
  if (!options) {
    throw new InvalidOptionsError();
  }
  const validationErrors = validateOptions(options);
  if (!isEmpty(validationErrors)) {
    throw new InvalidOptionsError(validationErrors);
  }
}

function validateOptions(options) {
  let errors = [];
  const missingConnectionErrors = validatePropsExists(
    options.connection,
    ['gh', 'v1'],
    p => `Missing ${p} connection option`,
  );
  errors = errors.concat(missingConnectionErrors);
  if (isEmpty(missingConnectionErrors)) {
    errors = errors
      .concat(
        validatePropsAreStrings(
          options.connection.gh,
          ['token'],
          p => `Invalid gh connection ${p} option`,
        ),
      )
      .concat(
        validatePropsAreStrings(
          options.connection.v1,
          ['host', 'instance', 'token'],
          p => `Invalid v1 connection ${p} option`,
        ),
      )
      .concat(
        validatePropsAreNumeric(
          options.connection.v1,
          ['port'],
          p => `Invalid v1 connection ${p} option`,
        ),
      );
  }
  errors = errors
    .concat(
      validatePropsAreStrings(
        options.assetToLabel || {},
        ['Story', 'Defect'],
        p => `Invalid ${p} asset to label mapping value`,
      ),
    )
    .concat(
      validatePropsAreStrings(
        options,
        ['scope', 'webhookId'],
        p => `Invalid ${p} option`,
      ),
    );

  return errors;
}
