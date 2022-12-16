const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = ({config}) => {
  // Importing files.
  const assetRule = config.module.rules.find(({test}) => test.test('.svg'));
  const assetLoader = {
    loader: assetRule.loader,
    options: assetRule.options || assetRule.query,
  };
  config.module.rules.unshift({
    test: /\.svg$/,
    use: ['@svgr/webpack', assetLoader],
  });

  // TS loader.
  config.resolve.plugins.push(new TsconfigPathsPlugin());

  // Simply copying what's in craco.config.js.
  const oneOfRule = config.module.rules.find(rule => rule.oneOf);
  if (oneOfRule) {
    const tsxRule = oneOfRule.oneOf.find(rule => rule.test && rule.test.toString().includes('tsx'));
    const newIncludePaths = [
      path.resolve(__dirname, '../../common'), // Web common directory.
      path.resolve(__dirname, '../../../common'), // Main common directory.
    ];
    tsxRule.use[0].options.configFile = path.resolve(__dirname, '../tsconfig.json');

    if (tsxRule) {
      if (Array.isArray(tsxRule.include)) {
        tsxRule.include = [...tsxRule.include, ...newIncludePaths];
      } else {
        tsxRule.include = [tsxRule.include, ...newIncludePaths];
      }
    }
  }

  // Importing styles.
  config.module.rules.unshift({
    test: /\.less$/,
    use: [
      {loader: 'style-loader'},
      {loader: 'css-loader'},
      {
        loader: 'less-loader',
        options: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    ],
  });

  return config;
};
