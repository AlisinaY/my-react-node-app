// frontend/.eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true // aktiviert u.a. `process` "Test"
  },
  settings: {
    react: { version: "detect" } // liest automatisch Deine React-Version aus package.json
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    ecmaFeatures: { jsx: true }
  },
  plugins: ["react", "prettier"],
  rules: {
    "react/react-in-jsx-scope": "off", // seit React 17 unnötig
    "react/prop-types": "off",
    "prettier/prettier": "error"
  },
  overrides: [
    {
      files: ["**/*.test.js", "**/*.spec.js"],
      env: { jest: true }, // aktiviert describe, test, expect…
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"]
    }
  ]
};
