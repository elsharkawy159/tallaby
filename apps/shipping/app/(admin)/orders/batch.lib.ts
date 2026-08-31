/**
 * A batch's human-friendly display id, e.g. `BATCH-00007`. Shared by the
 * assign dialog's result view, the /batches list, and the sheet export's
 * download filename.
 */
export function formatBatchLabel(seq: number): string {
  return `BATCH-${String(seq).padStart(5, "0")}`;
}
