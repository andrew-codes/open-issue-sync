module.exports = ({ handlers }) => {
  const requestHandlers = handlers.map(require);

  return {
    handle: async req => {
      return requestHandlers.map(handler => handler(req));
    },
  };
};
