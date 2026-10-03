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

module.exports = config;
