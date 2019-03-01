const webhooked = require('@andrew-codes/webhooked');

module.exports = async function(context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');
  context.log(req.body);
  try {
    const responses = await webhooked({
      handlers: ['@andrew-codes/github-issue-tester'],
    }).handle(req);
    context.log(responses);
    context.res = { status: 200 };
  } catch (errors) {
    context.log(errors);
    context.res = { status: 500 };
  }
};
