/** Product rows in the builder chat (browser-safe, no imports). */
export type SyncedField<T> = { value: T; synced: T };

/**
 * A product field the seller edits locally, when the server's value changes
 * (a chat reading filled the price, another tab saved): the new value shows,
 * unless the seller has typed since the last server value, which is kept.
 */
export function syncField<T>(field: SyncedField<T>, server: T): SyncedField<T> {
  if (Object.is(field.synced, server)) return field;
  return { value: Object.is(field.value, field.synced) ? server : field.value, synced: server };
}
