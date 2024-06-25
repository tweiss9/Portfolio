/* eslint-disable linebreak-style */
const {configs: recommendedConfig} = require("@eslint/js");
const googleConfig = require("eslint-config-google");

module.exports = [
  // Base configuration from eslint:recommended
  recommendedConfig.recommended,
  {
    ...googleConfig,
    rules: {
      ...googleConfig.rules,
      "valid-jsdoc": "off",
      "require-jsdoc": "off",
    },
  },
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"], // add any necessary ignore patterns
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "module",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    },
  },
  {
    files: ["**/*.spec.*"],
    languageOptions: {
      globals: {
        mocha: true,
      },
    },
    rules: {},
  },
];
