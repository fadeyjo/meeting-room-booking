const path = require('path');
const { createWebpackConfig } = require('../webpack-config');

const repoRoot = path.resolve(__dirname, '../..');
function remoteUrl(base) {
  const b = base.replace(/\/$/, '');
  return `${b}/remoteEntry.js`;
}

const book = process.env.MF_BOOKINGS_URL || 'http://localhost:3081';
const meet = process.env.MF_MEETINGS_URL || 'http://localhost:3082';
const adm = process.env.MF_ADMIN_URL || 'http://localhost:3083';

module.exports = createWebpackConfig({
  packageRoot: __dirname,
  repoRoot,
  name: 'host',
  port: Number(process.env.MF_HOST_PORT) || 3080,
  isHost: true,
  exposes: {},
  remotes: {
    bookings: `bookings@${remoteUrl(book)}`,
    meetings: `meetings@${remoteUrl(meet)}`,
    admin: `admin@${remoteUrl(adm)}`,
  },
  entry: './src/main.tsx',
  htmlTemplate: path.join(__dirname, 'index.html'),
  title: 'Бронирование переговорных',
  apiUrl: process.env.MRB_API_URL || '',
});
