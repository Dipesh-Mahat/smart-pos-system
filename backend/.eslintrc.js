module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    // Enforce consistent casing in filenames
    "filenames/match-regex": ["error", "^[a-z][a-zA-Z0-9.]+$", true],
    // Enforce consistent casing in imports
    "import/no-unresolved": "off", // Since we're dealing with Node.js
    // Add strict path casing for imports if needed
  },
  plugins: ["filenames"],
  settings: {
    "import/resolver": {
      node: {
        paths: ["backend"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};

