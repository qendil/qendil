module.exports = {
  parser: "@typescript-eslint/parser",
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/strict",
    "plugin:testing-library/react",
    "xo/browser",
    "xo-react",
    "plugin:react/jsx-runtime",
    "plugin:unicorn/all",
    "prettier",
  ],
  plugins: [
    "@typescript-eslint",
    "eslint-plugin-tsdoc",
    "react",
    "testing-library",
    "jsx-a11y",
  ],
  settings: {
    react: { version: "18.0.0" },
    jsdoc: { mode: "typescript" },
    node: { tryExtensions: [".ts", ".tsx", ".js", ".json"] },
  },
  parserOptions: {
    project: [
      `${__dirname}/packages/*/tsconfig.json`,
      `${__dirname}/tsconfig.json`,
      `${__dirname}/tsconfig.node.json`,
    ],
  },
  rules: {
    "no-void": "off",
    "object-shorthand": ["error", "properties"],
    complexity: "warn",
    "no-warning-comments": "off",
    "no-undef": "off", // Overridden by @typescript-eslint/no-undef
    "no-dupe-class-members": "off", // Overridden by @typescript-eslint
    "no-loop-func": "off", // Overridden by @typescript-eslint
    "no-loss-of-precision": "off", // Overridden by @typescript-eslint
    "no-redeclare": "off", // Overridden by @typescript-eslint
    "no-shadow": "off", // Overridden by @typescript-eslint
    "no-unused-expressions": "off", // Overridden by @typescript-eslint
    "no-use-before-define": "off", // Overridden by @typescript-eslint
    "no-useless-constructor": "off", // Overridden by @typescript-eslint
    "no-return-await": "off", // Overridden by @typescript-eslint
    "no-unused-vars": "off", // Overridden by @typescript-eslint

    "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-check": true,
        "ts-expect-error": "allow-with-description",
        "ts-ignore": false,
        "ts-nocheck": false,
      },
    ],
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "allow-as-parameter",
      },
    ],
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/consistent-type-exports": [
      "error",
      { fixMixedExportsWithInlineTypeSpecifier: true },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/default-param-last": "error",
    "@typescript-eslint/method-signature-style": ["error", "property"],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        leadingUnderscore: "allowSingleOrDouble",
        trailingUnderscore: "allowDouble",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
        selector: "variable",
      },
    ],
    "@typescript-eslint/no-confusing-void-expression": [
      "error",
      { ignoreArrowShorthand: true },
    ],
    "@typescript-eslint/no-dupe-class-members": "error",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-loop-func": "error",
    "@typescript-eslint/no-loss-of-precision": "error",
    "@typescript-eslint/no-meaningless-void-operator": [
      "error",
      { checkNever: true },
    ],
    "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
    "@typescript-eslint/no-redeclare": "error",
    "@typescript-eslint/no-redundant-type-constituents": "error",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/no-unnecessary-condition": [
      "error",
      { allowConstantLoopConditions: true },
    ],
    "@typescript-eslint/no-unnecessary-qualifier": "error",
    "@typescript-eslint/no-unused-expressions": "error",
    "@typescript-eslint/no-use-before-define": "error",
    "@typescript-eslint/no-useless-constructor": "error",
    "@typescript-eslint/no-useless-empty-export": "error",
    "@typescript-eslint/prefer-enum-initializers": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/prefer-regexp-exec": "error",
    "@typescript-eslint/promise-function-async": "warn",
    "@typescript-eslint/require-array-sort-compare": [
      "error",
      { ignoreStringArrays: true },
    ],
    "@typescript-eslint/return-await": ["error", "in-try-catch"],
    "@typescript-eslint/sort-type-union-intersection-members": "warn",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-var-requires": "off", // Handled by @typescript-eslint/no-require-imports
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: false },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-extraneous-class": [
      "warn",
      { allowStaticOnly: true },
    ],

    "react/display-name": "off",
    "react/forbid-component-props": [
      "error",
      {
        forbid: [{ propName: "style", message: "Use CSS modules instead." }],
      },
    ],
    "react/jsx-filename-extension": [1, { extensions: [".jsx", ".tsx"] }],
    "react/jsx-handler-names": [
      "error",
      {
        checkInlineFunction: false,
        checkLocalVariables: false,
        eventHandlerPrefix: "handle",
        eventHandlerPropPrefix: "on",
      },
    ],
    "react/jsx-indent": "off",
    "react/jsx-max-props-per-line": "off",
    "react/jsx-newline": ["error", { prevent: true }],
    "react/jsx-no-script-url": "error",
    "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
    "react/no-did-mount-set-state": "error",
    "react/no-did-update-set-state": "error",
    "react/no-set-state": "error", // Use function components
    "react/no-unstable-nested-components": "error",
    "react/no-will-update-set-state": "error",
    "react/prefer-es6-class": "error",
    "react/prefer-stateless-function": "error",
    "react/sort-comp": "error",
    "react/sort-prop-types": "error",
    "react/require-default-props": "off",

    "react-hooks/exhaustive-deps": [
      "warn",
      { additionalHooks: "useThreeView|useGameView" },
    ],

    "unicorn/prevent-abbreviations": [
      "error",
      {
        checkProperties: false,
        replacements: {
          args: false,
          pkg: false,
          props: false,
          ref: false,
          rel: false,
        },
      },
    ],
    "unicorn/prefer-top-level-await": "off",
    "unicorn/no-keyword-prefix": ["error", { disallowedPrefixes: ["new"] }],
    "unicorn/numeric-separators-style": [
      "error",
      { hexadecimal: { minimumDigits: 9 } },
    ],
    "unicorn/consistent-function-scoping": [
      "error",
      { checkArrowFunctions: false },
    ],
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/explicit-member-accessibility": "error",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-return": "error",
        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/restrict-template-expressions": "error",
        "@typescript-eslint/restrict-plus-operands": "error",
      },
    },
    {
      files: ["**/__mock__/**"],
      rules: {
        "@typescript-eslint/no-unsafe-member-access": "off",
      },
    },
    {
      files: ["*.spec.ts", "*.spec.tsx"],
      rules: {
        "@typescript-eslint/unbound-method": "off",
      },
    },
  ],
};
