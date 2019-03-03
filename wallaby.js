module.exports = function() {
  return {
    files: [
      'packages/**/*.js',
      '!packages/**/*.test.js',
      { pattern: 'packages/**/node_modules/**', ignore: true },
    ],
    tests: ['packages/**/*.test.js'],
    filesWithNoCoverageCalculated: [
      'packages/**/testing/**/*.js',
      'packages/webhooked-plugin-example/**/*.js',
    ],
    env: {
      type: 'node',
      runner: 'node',
    },
    testFramework: 'jest',
  };
};
