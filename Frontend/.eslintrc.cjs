const globals = require("globals");
const pluginReact = require("eslint-plugin-react");
const eslintJs = require("@eslint/js");
const pluginReactHooks = require("eslint-plugin-react-hooks");
const pluginReactRefresh = require("eslint-plugin-react-refresh");

module.exports = [
  {
    ignores: ["dist/**"],
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    ...eslintJs.configs.recommended,
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    settings: {
      react: {
        version: "detect", // Automatically detect the React version
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/prop-types": "off",
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
];