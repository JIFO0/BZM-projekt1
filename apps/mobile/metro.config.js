const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

const citiesDir = path.resolve(projectRoot, '../../cities');
const fixturesDir = path.resolve(projectRoot, '../../fixtures');

config.watchFolders = [
  ...(config.watchFolders ?? []),
  citiesDir,
  fixturesDir,
  workspaceRoot,
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Exclude backend directory and graphhopper data cache from Metro bundler
const backendPattern = new RegExp(
  `^${path.resolve(workspaceRoot, 'backend').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`
);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
    ? [config.resolver.blockList]
    : []),
  backendPattern,
];

module.exports = config;
