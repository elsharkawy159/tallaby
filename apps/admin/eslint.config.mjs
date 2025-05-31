import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Allow semicolons
      "semi": ["warn", "always"],

      // Allow unused vars if they start with "_"
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }
      ],

      // Temporarily allow `any` type
      "@typescript-eslint/no-explicit-any": "warn",

      // Allow @ts-ignore
      "@typescript-eslint/ban-ts-comment": [
        "warn",
        {
          "ts-ignore": false,
          "ts-nocheck": false,
          "ts-expect-error": false
        }
      ],

      // Only warn on <img> usage
      "@next/next/no-img-element": "warn",

      // Relax JSX escaping (optional)
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
