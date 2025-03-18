// const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * @type {import('@react-native/metro-config').MetroConfig}
//  */
// const config = {};

// // module.exports = mergeConfig(getDefaultConfig(__dirname), config);

// module.exports = (async () => {
//   const {
//     resolver: { assetExts },
//   } = await getDefaultConfig();
//   return {
//     resolver: {
//       assetExts: [...assetExts, 'png', 'jpg', 'jpeg', 'gif', 'svg'],
//     },
//   };
// })();

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);