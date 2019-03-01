module.exports = ({ handlers }) => {
  return {
    handle: async req => {
      return handlers
        .map(moduleName => {
          if (!Array.isArray(moduleName)) {
            return {
              handlerFn: require(moduleName),
            };
          }
          const [module, options] = moduleName;
          const handlerFn = require(module);
          return { handlerFn, options };
        })
        .map(({ handlerFn, options }) => {
          if (options) {
            return handlerFn(req, options);
          }
          return handlerFn(req);
        });
    },
  };
};
