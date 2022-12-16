module.exports = {
  extends: ['plugin:react-hooks/recommended'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: ['.eslintrc.js', 'craco.config.js', 'build/', 'public/'],
  plugins: ['react'],
  env: {
    browser: true,
  },
  globals: {
    miterLib: 'readonly',
    zoomSdk: 'readonly',
  },
  rules: {
    //==============================================================================================
    //                                        REACT RULES
    //==============================================================================================
    'jsx-quotes': ['warn', 'prefer-double'],
    'react/function-component-definition': [
      'warn',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/no-invalid-html-attribute': 'warn',
    'react/no-unknown-property': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-boolean-value': ['warn', 'never'],
    'react/jsx-closing-bracket-location': 'warn',
    'react/jsx-closing-tag-location': 'warn',
    'react/jsx-curly-brace-presence': [
      'warn',
      {
        props: 'never',
        children: 'never',
      },
    ],
    'react/jsx-equals-spacing': ['warn', 'never'],
    'react/jsx-first-prop-new-line': ['warn', 'multiline-multiprop'],
    'react/jsx-fragments': ['warn', 'syntax'],
    'react/jsx-indent': [
      'warn',
      2,
      {
        indentLogicalExpressions: true,
        checkAttributes: true,
      },
    ],
    'react/jsx-indent-props': ['warn', 2],
    'react/jsx-no-target-blank': 'warn',
    'react/jsx-no-useless-fragment': 'off',
    'react/jsx-props-no-multi-spaces': 'warn',
    'react/jsx-tag-spacing': 'warn',
    'react/jsx-wrap-multilines': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },

  settings: {
    react: {
      version: 'detect',
    },
  },
};
