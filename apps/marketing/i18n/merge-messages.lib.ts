export type Messages = { [key: string]: string | Messages };

const isObject = (value: unknown): value is Messages =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Merges namespaces key by key, so a file can add to a namespace without replacing it. "extra" wins. */
export function deepMergeMessages(base: Messages, extra: Messages): Messages {
  const merged: Messages = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = merged[key];
    merged[key] = isObject(current) && isObject(value) ? deepMergeMessages(current, value) : value;
  }
  return merged;
}
