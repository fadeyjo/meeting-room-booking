const path = require('path');
const { createWebpackConfig } = require('../webpack-config');

const repoRoot = path.resolve(__dirname, '../..');

module.exports = createWebpackConfig({
  packageRoot: __dirname,
  repoRoot,
  name: 'bookings',
  port: 3081,
  isHost: false,
  entry: './src/index.tsx',
  exposes: {
    './Home': './src/exposes/Home.tsx',
    './BookRoutes': './src/exposes/BookRoutes.tsx',
  },
  apiUrl: process.env.MRB_API_URL || '',
});
