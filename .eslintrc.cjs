module.exports = {
  root: true,
  env: { node: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2022 },
  ignorePatterns: ['node_modules', 'dist', 'build'],
};
