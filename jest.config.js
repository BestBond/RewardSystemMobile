module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.svg': '<rootDir>/__mocks__/svgMock.tsx',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|react-navigation|@react-navigation|react-native-screens)',
  ],
};
