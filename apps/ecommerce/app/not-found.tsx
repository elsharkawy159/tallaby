// Ultimate fallback for requests that don't even match the [locale] segment
// (e.g. a malformed URL). The localized 404 lives at app/[locale]/not-found.tsx.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            display: "grid",
            minHeight: "100vh",
            placeItems: "center",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div>
            <p style={{ fontWeight: 600 }}>404</p>
            <h1 style={{ fontSize: "2rem", margin: "1rem 0" }}>
              Page not found
            </h1>
            <a href="/">Go back home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
