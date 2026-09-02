// Structural root layout for routes outside app/[locale]/ (not-found.tsx,
// and the sitemap.ts/robots.ts/manifest.ts route handlers). Next.js's App
// Router requires a root layout to exist at this level even though it
// renders nothing itself — app/[locale]/layout.tsx supplies <html>/<body>
// for locale pages, and app/not-found.tsx supplies its own for the
// top-level 404 fallback.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
