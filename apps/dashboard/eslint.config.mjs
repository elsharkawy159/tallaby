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
  // Internal navigation keeps the seller's locale (docs/plans/dashboard-static-shell.md
  // Phase 1.5): Arabic unprefixed, English under /en. Use @/i18n/navigation; for an
  // external, /api or already-localized URL, add an eslint-disable-next-line with the reason.
  files: ["**/*.ts", "**/*.tsx"],
  ignores: [
    "i18n/navigation.ts",
    // TODO(Phase 1.5): owner's uncommitted work; move its Link to @/i18n/navigation once committed.
    "app/[[]locale]/(main)/orders/order-details-dialog.client.tsx",
  ],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [
        {
          name: "next/link",
          importNames: ["default"],
          message: "Use Link from @/i18n/navigation so the seller's locale is kept.",
        },
        {
          name: "next/navigation",
          importNames: ["redirect", "permanentRedirect", "useRouter", "usePathname"],
          message: "Use @/i18n/navigation so the seller's locale is kept (server: redirect({ href, locale: await getLocale() })).",
        },
      ],
    }],
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}];

export default eslintConfig;
