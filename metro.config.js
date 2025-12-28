const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add avif to supported asset extensions
config.resolver.assetExts.push('avif');

module.exports = config;
