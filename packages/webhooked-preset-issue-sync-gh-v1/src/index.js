const plugins = [
  require('@andrew-codes/webhooked-plugin-issues-create-v1-assets'),
  require('@andrew-codes/webhooked-plugin-issues-create-v1-assets'),
];

module.exports = async (req, options) => {
  return await plugins.map(async plugin => plugin(req, options));
};
