export interface BulletPointParts {
  label: string;
  value: string;
}

/**
 * Splits a bullet point authored as "Label: value" into its parts.
 * The label is capped at 60 chars so a sentence that merely contains a
 * colon further in isn't mistakenly bolded in full.
 */
export function splitBulletPoint(point: string): BulletPointParts | null {
  const match = point.match(/^([^:]{1,60}):\s*(.+)$/);
  if (!match) return null;

  const label = match[1]!.trim();
  const value = match[2]!.trim();

  if (!label || !value) return null;

  return { label, value };
}
