module.exports = function (api) {
  api.cache(true);
  return {
    // zustand の ESM ビルドが import.meta を含むため Web で変換が必要
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
