const path = require('path');
const { createWebpackConfig } = require('../webpack-config');

const repoRoot = path.resolve(__dirname, '../..');

module.exports = createWebpackConfig({
  packageRoot: __dirname,
  repoRoot,
  name: 'admin',
  port: 3083,
  isHost: false,
  entry: './src/index.tsx',
  exposes: {
    './Admin': './src/exposes/Admin.tsx',
  },
  apiUrl: process.env.MRB_API_URL || '',
});
