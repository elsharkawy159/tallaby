import { notFound } from "next/navigation";

// Unknown paths under a locale (e.g. the old marketplace /products) render the
// localized app/[locale]/not-found.tsx instead of the bare global 404.
export default function CatchAllNotFound() {
  notFound();
}
