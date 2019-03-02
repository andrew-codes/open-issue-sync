const webhooked = require('@andrew-codes/webhooked');

module.exports = async function(context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');
  try {
    const responses = await webhooked({
      plugins: ['@andrew-codes/webhooked-plugin-example'],
    }).handle(req);
    context.log(responses);
    context.res = { status: 200 };
  } catch (errors) {
    context.log(errors);
    context.res = { status: 500 };
  }
};
