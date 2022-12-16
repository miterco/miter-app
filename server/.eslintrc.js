module.exports = {
  extends: [
    "plugin:jest/recommended",
  ],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  ignorePatterns: [
    "static/",
    "static-src",
    ".eslintrc.js",
  ],
  plugins: [
    "jest",
  ],
  env: {
    node: true,
    browser: true,
    "jest/globals": true,
  },
  globals: {
    miterLib: "readonly",
    zoomSdk: "readonly"
  },
  rules: {
    //==============================================================================================
    //                                         JEST RULES
    //==============================================================================================
    "jest/expect-expect": ["off", { assertFunctionNames: ["expect"] }],
    "jest/consistent-test-it": "warn",
    "jest/no-commented-out-tests": "warn",
    "jest/no-disabled-tests": "warn",
    "jest/no-done-callback": "warn",
    "jest/no-duplicate-hooks": "warn",
    // "jest/no-export": "warn",
    "jest/no-identical-title": "warn",
    "jest/prefer-to-have-length": "warn",
    "jest/prefer-to-contain": "warn",
    "jest/prefer-to-be": "warn",
    "jest/prefer-todo": "warn",
    "jest/valid-expect": "warn",
    "jest/valid-title": "warn",
    "jest/no-conditional-expect": "off",
  },
};
