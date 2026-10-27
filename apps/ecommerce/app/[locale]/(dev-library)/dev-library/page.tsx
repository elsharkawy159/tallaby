import { devLibraryData } from "./dev-library.server";
import { DevLibrary } from "./dev-library.client";

/** Every code section design and template, previewed live (noindex; see `dev-library.server.ts`). */
export default function DevLibraryPage() {
  return <DevLibrary data={devLibraryData()} />;
}
