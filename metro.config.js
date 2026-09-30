const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite loads a WebAssembly build of SQLite on web. Metro needs to treat
// `.wasm` as an asset so that import resolves. Required for web support, which
// Expo currently marks as alpha.
config.resolver.assetExts.push('wasm');

module.exports = config;
