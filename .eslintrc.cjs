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
        // Allow console.log for debugging in development.
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        indent: ['error', 4],
        'no-underscore-dangle': 'off',
        'operator-linebreak': 'off',
        'import/no-dynamic-require': 'off',
        'import/extensions': 'off',
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
        'import/prefer-default-export': 'off',
    },
};
