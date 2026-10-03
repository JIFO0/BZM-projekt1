const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Expo watches workspace packages automatically. The city file lives outside
// those packages, at /cities, so Metro will not bundle it unless it is listed.
const citiesDir = path.resolve(projectRoot, '../../cities');
config.watchFolders = [...(config.watchFolders ?? []), citiesDir];

module.exports = config;
