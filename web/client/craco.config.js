const CracoLessPlugin = require('craco-less');
const path = require('path');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    },

    {
      plugin: {
        // Pulled without complete understanding from https://github.com/facebook/create-react-app/issues/9127
        overrideWebpackConfig: ({webpackConfig}) => {
          const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
          if (oneOfRule) {
            const tsxRule = oneOfRule.oneOf.find(rule => rule.test && rule.test.toString().includes('tsx'));
            const newIncludePaths = [path.resolve(__dirname, '../common'), path.resolve(__dirname, '../../common')];
            if (tsxRule) {
              if (Array.isArray(tsxRule.include)) {
                tsxRule.include = [...tsxRule.include, ...newIncludePaths];
              } else {
                tsxRule.include = [tsxRule.include, ...newIncludePaths];
              }
            }
          }

          // Add a rule to support named exports in MJS modules.
          const mjsRule = webpackConfig.module.rules.find(rule => rule.test && rule.test.toString().includes('mjs'));
          if (!mjsRule) {
            webpackConfig.module.rules.push({
              test: /\.mjs$/,
              include: /node_modules/,
              type: 'javascript/auto',
            });
          }

          return webpackConfig;
        },
      },
    },
  ],
};
