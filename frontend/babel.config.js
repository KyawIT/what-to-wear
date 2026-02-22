module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Keep Worklets plugin explicit below to avoid duplicate plugin injection.
          worklets: false,
        },
      ],
      'nativewind/babel',
    ],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],

          alias: {
            '@': './',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      // Must be last.
      'react-native-worklets/plugin',
    ],
  };
};
