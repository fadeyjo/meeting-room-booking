const path = require('path');
const { createWebpackConfig } = require('../webpack-config');

const repoRoot = path.resolve(__dirname, '../..');

module.exports = createWebpackConfig({
  packageRoot: __dirname,
  repoRoot,
  name: 'meetings',
  port: 3082,
  isHost: false,
  entry: './src/index.tsx',
  exposes: {
    './Meetings': './src/exposes/Meetings.tsx',
    './Invitations': './src/exposes/Invitations.tsx',
    './Invite': './src/exposes/Invite.tsx',
    './InviteBooking': './src/exposes/InviteBooking.tsx',
    './BookingDetail': './src/exposes/BookingDetail.tsx',
  },
  apiUrl: process.env.MRB_API_URL || '',
});
