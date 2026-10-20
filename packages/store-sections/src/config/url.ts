/** URL safety helpers shared by the schema and the sanitizer. Pure, no DOM. */

// Browsers ignore ASCII whitespace and control characters inside a scheme
// ("java\tscript:"), so strip them before looking at the scheme.
const IGNORED_IN_SCHEME = /[\u0000- \u007f-\u009f]/g;

const DANGEROUS_SCHEME = /^(?:javascript|vbscript|data|file|blob|filesystem):/;

/** True for strings that a browser would run or load as a dangerous URL. */
export function hasDangerousScheme(value: string): boolean {
  return DANGEROUS_SCHEME.test(value.replace(IGNORED_IN_SCHEME, "").toLowerCase());
}

/** Absolute http(s) URL or a same-origin path (`/x`, not `//host`). */
export function isHttpOrRelativeUrl(value: string): boolean {
  const v = value.trim();
  return /^https?:\/\/[^\s]+$/i.test(v) || /^\/(?!\/)[^\s]*$/.test(v);
}
