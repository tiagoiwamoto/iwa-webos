const path = require('path');
const mode = process.env.NODE_ENV || 'development';

/*
 * Shared webpack config factory for WebOS application packages.
 * Usage: module.exports = require('../_shared/webpack.config.js')(__dirname);
 */
module.exports = dir => ({
  mode,
  devtool: 'source-map',
  entry: [path.resolve(dir, 'index.js')],
  output: {
    path: path.resolve(dir, 'dist'),
    filename: 'main.js',
    hashFunction: 'sha256'
  },
  optimization: {
    minimize: mode === 'production'
  },
  externals: {
    osjs: 'OSjs'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {loader: 'babel-loader'}
    }, {
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
      use: {loader: 'babel-loader'}
    }]
  }
});
