// Metro autoconfigura monorepos pnpm desde SDK 52+ (docs.expo.dev/guides/monorepos).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
