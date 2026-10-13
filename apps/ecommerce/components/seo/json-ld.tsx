/**
 * Renders a JSON-LD script. "<" is escaped so seller/admin-supplied text
 * (descriptions, names) can't close the script tag and inject HTML, per the
 * Next.js JSON-LD guide.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
