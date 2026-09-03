/**
 * Light-theme tokens mirrored from `packages/ui/src/styles/globals.css`.
 * Email clients cannot use CSS variables, so values are hex.
 */
export const emailColor = {
  background: "#fafaf8",
  foreground: "#333333",
  primary: "#145163",
  primaryForeground: "#fafafa",
  secondary: "#89a8b1",
  muted: "#f7f7f7",
  mutedForeground: "#808080",
  accent: "#fdad28",
  border: "#e2cbcb",
  card: "#ffffff",
  success: "#0f766e",
} as const;

export const emailRadius = {
  sm: "6px",
  md: "8px",
  lg: "10px",
} as const;

export const emailFont = {
  sans: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  arabic: 'Tahoma, Arial, "Noto Kufi Arabic", sans-serif',
} as const;

export const EMAIL_CONTACT = "tallabycommerce@gmail.com";
export const EMAIL_SITE_URL = "https://www.tallaby.com";
