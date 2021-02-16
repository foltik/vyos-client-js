/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/src/?(*.)+(spec|test).[tj]s?(x)"
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};
