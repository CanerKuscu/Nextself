const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, 'packages/shared');

// Watch the shared monorepo package
config.watchFolders = [sharedRoot];

// Let all packages fall back to the root node_modules for resolution.
// This avoids breaking hierarchical lookup for nested packages
// (e.g. react-native-quick-crypto -> react-native-nitro-modules).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Disable the flag that prevents hierarchical (upward) node_modules lookup.
// This ensures packages inside node_modules can find their peer dependencies.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
