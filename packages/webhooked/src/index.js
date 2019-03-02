module.exports = ({ plugins }) => {
  return {
    handle: async req => {
      return plugins
        .map(pluginName => {
          if (!Array.isArray(pluginName)) {
            return {
              pluginFn: require(pluginName),
            };
          }
          const [module, options] = pluginName;
          const pluginFn = require(module);
          return { pluginFn, options };
        })
        .map(({ pluginFn, options }) => {
          if (options) {
            return pluginFn(req, options);
          }
          return pluginFn(req);
        });
    },
  };
};
