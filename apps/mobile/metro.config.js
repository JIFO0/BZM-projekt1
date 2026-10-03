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

// Helper to escape regex special characters for path matching
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Exclude directories not needed by the mobile bundle to speed up Metro file-walking
const excludedDirs = [
  path.resolve(workspaceRoot, 'backend'),
  path.resolve(workspaceRoot, 'packages', 'cli'),
  path.resolve(workspaceRoot, 'docs'),
  path.resolve(workspaceRoot, 'tasks'),
  path.resolve(workspaceRoot, 'scripts'),
  path.resolve(workspaceRoot, 'schemas'),
];

const exclusionPatterns = excludedDirs.map(
  (dir) => new RegExp(`^${escapeRegExp(dir)}([\\/\\\\].*)?$`)
);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'expo-location': path.resolve(workspaceRoot, 'node_modules/expo-location'),
};

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  ...exclusionPatterns,
];

module.exports = config;
