const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the shared Monorepo package
config.watchFolders = [path.resolve(__dirname, 'packages/shared')];

// Ensure metro resolves the workspace nodes
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'packages/shared/node_modules')
];

module.exports = config;
