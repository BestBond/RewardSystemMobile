const { getDefaultConfig } = require('@react-native/metro-config');

/**
 * Metro configuration — https://reactnative.dev/docs/metro
 * @type {import('@react-native/metro-config').MetroConfig}
 */
module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };

  config.resolver = {
    ...config.resolver,
    assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...config.resolver.sourceExts, 'svg'],
  };

  return config;
})();
