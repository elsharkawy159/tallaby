import { emailColor } from "./tokens.js";

/**
 * Tailwind config consumed by React Email's `<Tailwind>` wrapper.
 * Future templates should use these color names rather than raw hex.
 */
export const emailTailwind = {
  theme: {
    extend: {
      colors: {
        background: emailColor.background,
        foreground: emailColor.foreground,
        primary: emailColor.primary,
        "primary-foreground": emailColor.primaryForeground,
        secondary: emailColor.secondary,
        muted: emailColor.muted,
        "muted-foreground": emailColor.mutedForeground,
        accent: emailColor.accent,
        border: emailColor.border,
        card: emailColor.card,
        success: emailColor.success,
      },
    },
  },
};
