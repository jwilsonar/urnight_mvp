import base from '@urnight/config/eslint';

export default [
  ...base,
  { ignores: ['.expo/**', 'expo-env.d.ts', 'metro.config.js', 'babel.config.js'] },
];
