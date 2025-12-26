import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
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
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}];

export default eslintConfig;
