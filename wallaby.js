module.exports = function() {
  return {
    files: [
      'packages/**/*.js',
      '!packages/**/*.test.js',
      { pattern: 'packages/**/node_modules/**', ignore: true },
    ],
    tests: ['packages/**/*.test.js'],
    env: {
      type: 'node',
      runner: 'node',
    },
    testFramework: 'jest',
  };
};
