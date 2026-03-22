const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container } = require('webpack');

function createWebpackConfig({
  packageRoot,
  repoRoot,
  name,
  port,
  isHost,
  exposes = {},
  remotes = {},
  entry = './src/index.tsx',
  htmlTemplate,
  title = 'Бронирование переговорных',
  apiUrl = '',
}) {
  const sharedPath = path.join(repoRoot, 'shared');
  const storePath = path.join(repoRoot, 'packages/store/src');

  const shared = {
    react: { singleton: true, requiredVersion: '^18.3.1', eager: isHost },
    'react-dom': { singleton: true, requiredVersion: '^18.3.1', eager: isHost },
    'react-router-dom': { singleton: true, requiredVersion: '^6.28.0', eager: isHost },
    'react-redux': { singleton: true, requiredVersion: '^9.2.0', eager: isHost },
    '@reduxjs/toolkit': { singleton: true, requiredVersion: '^2.11.0', eager: isHost },
    '@reduxjs/toolkit/query': { singleton: true, requiredVersion: '^2.11.0', eager: isHost },
    '@reduxjs/toolkit/query/react': { singleton: true, requiredVersion: '^2.11.0', eager: isHost },
    '@mrb/store': {
      singleton: true,
      requiredVersion: false,
      eager: isHost,
    },
  };

  const plugins = [
    new webpack.DefinePlugin({
      MRB_API_URL: JSON.stringify(apiUrl),
      'process.env.MRB_API_URL': JSON.stringify(apiUrl),
    }),
    new container.ModuleFederationPlugin({
      name,
      remotes,
      shared,
      ...(Object.keys(exposes).length
        ? { exposes, filename: 'remoteEntry.js' }
        : {}),
    }),
  ];

  if (isHost && htmlTemplate) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: htmlTemplate,
        title,
      })
    );
  }

  return {
    context: packageRoot,
    entry: isHost ? entry : { main: entry },
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-cheap-module-source-map',
    output: {
      path: path.join(packageRoot, 'dist'),
      filename: '[name].[contenthash].js',
      publicPath: 'auto',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@shared': sharedPath,
        '@mrb/store': storePath,
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: { transpileOnly: true },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    plugins,
    devServer: isHost
      ? {
          port,
          historyApiFallback: true,
          hot: true,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      : {
          port,
          hot: true,
          headers: { 'Access-Control-Allow-Origin': '*' },
        },
  };
}

module.exports = { createWebpackConfig };
