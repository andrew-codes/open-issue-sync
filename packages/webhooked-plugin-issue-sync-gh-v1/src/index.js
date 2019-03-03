const fetch = require('fetch-node');
const fetchConnector = require('@andrew-codes/v1sdk-fetch-connector');
const GitHub = require('github-api');
const v1sdk = require('v1sdk').default;
const { isEmpty } = require('lodash');
const {
  isRequestFromV1,
} = require('@andrew-codes/webhooked-v1-request-matchers');
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
  const v1Api = connectedSdk(
    v1.host,
    v1.instance,
    v1.port,
    v1.isHttps,
  ).withAccessToken(v1.token);
  const ghApi = new GitHub({ token: gh.token });
  const issues = ghApi.getIssues();

  if (matchesActions(req, ['labeled'], options.connection.gh.hmacKey)) {
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
    const { _oid } = await v1Api.create(assetType, {
      links: { name: 'Github Issue', url: req.body.issue.url },
      name: req.body.issue.title,
      scope,
      taggedWith: [`github-${req.body.issue.number}`, 'github'],
      team,
    });
    return await issues.editIssue(req.body.issue.number, {
      labels: [`v1-${_oid}`, 'v1'],
    });
  } else if (isRequestFromV1(req, options.connection.v1.hmacKey)) {
    return await req.body.events
      .filter(event => event.eventType === 'AssetChanged')
      .filter(
        event =>
          !isEmpty(event.snapshot[0].taggedWith) &&
          !event.snapshot[0].taggedWith.find(tag => /^github-\d+$/.test(tag)),
      )
      .map(async event => {
        const { number, url } = await issues.createIssue({
          title: event.snapshot[0].Name,
          description: event.snapshot[0].Description,
          labels: [`v1-${event.snapshot[0]._oid}`, 'v1'],
        });
        return await v1Api.update(event.snapshot[0]._oid, {
          taggedWith: ['github', `github-${number}`],
          links: [{ name: 'Github Issue', url }],
        });
      });
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
          ['token', 'hmacKey'],
          p => `Invalid gh connection ${p} option`,
        ),
      )
      .concat(
        validatePropsAreStrings(
          options.connection.v1,
          ['host', 'instance', 'token', 'hmacKey'],
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
