type Messages = { [key: string]: unknown };

const isObject = (value: unknown): value is Messages => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Deep-merges message trees (the dashboard's own messages plus the shared
 * editor package's, which hold `storeEditor`, `mediaLibrary`, `websiteDesign`,
 * `websiteTemplates` and `storeForms.templates`). Nested namespaces merge key
 * by key; for the same leaf the later source wins. Inputs are not changed.
 */
export function mergeMessages(...sources: Messages[]): Messages {
  const out: Messages = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      const current = out[key];
      out[key] = isObject(current) && isObject(value) ? mergeMessages(current, value) : value;
    }
  }
  return out;
}
