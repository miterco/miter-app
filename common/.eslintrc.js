module.exports = {
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules', '.eslintrc.js'],
  env: {
    node: true,
    browser: true,
  },
  globals: {
    miterLib: 'readonly',
    zoomSdk: 'readonly',
  },
};
