import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import onlyWarn from "eslint-plugin-only-warn"
import turboPlugin from "eslint-plugin-turbo"
import tseslint from "typescript-eslint"

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    // Animations are native (CSS + IntersectionObserver, @workspace/motion): no animation library comes back.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "gsap", message: "Use @workspace/motion (data-animate presets) instead of GSAP." },
            { name: "lenis", message: "Native smooth scrolling only (CSS scroll-behavior); no Lenis." },
          ],
          patterns: [{ group: ["gsap/*", "@gsap/*"], message: "Use @workspace/motion (data-animate presets) instead of GSAP." }],
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
]
