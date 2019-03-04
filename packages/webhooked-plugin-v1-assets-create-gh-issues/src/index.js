const createV1 = require('@andrew-codes/v1sdk-fetch');
const GitHub = require('github-api');
const { isEmpty } = require('lodash');
const {
  isRequestFromV1,
} = require('@andrew-codes/webhooked-v1-request-matchers');
const {
  InvalidOptionsError,
  validatePropsAreNumeric,
  validatePropsAreStrings,
  validatePropsExists,
} = require('@andrew-codes/webhooked-utils');

module.exports = async (req, options) => {
  ensureOptionsAreValid(options);
  const {
    v1: { host, instance, isHttps, port, token },
    gh,
  } = options.connection;
  const v1Api = createV1({
    host,
    instance,
    port,
    isHttps,
    token,
  });
  const ghApi = new GitHub({ token: gh.token });
  const issues = ghApi.getIssues();
  if (isRequestFromV1(req, options.connection.v1.hmacKey)) {
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
  if (!options.connection) {
    return ['Missing connection option'];
  }
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
