class InvalidOptionsError extends Error {
  constructor(invalidOptions, ...args) {
    super(
      invalidOptions
        ? `Options Error: ${invalidOptions.join(', ')}`
        : 'Missing options',
      ...args,
    );
    Error.captureStackTrace(this, InvalidOptionsError);
    this.invalidOptions = invalidOptions;
  }
}

module.exports = InvalidOptionsError;
