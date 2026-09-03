export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : `{${key}}`
  );
}
