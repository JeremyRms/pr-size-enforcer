module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Allow console.log for debugging in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // Allow underscore dangle for GitHub API properties
    'no-underscore-dangle': 'off',
    // Allow require() in addition to import
    'import/no-dynamic-require': 'off',
    // Allow dev dependencies in test files
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.js',
          '**/*.spec.js',
          '**/jest.config.js',
          '**/__tests__/**',
        ],
      },
    ],
  },
};
