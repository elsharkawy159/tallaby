/**
 * The inline `<head>` script that turns animations on before the first paint:
 * it only adds `js-animations` to `<html>`. Without it (no JavaScript) the
 * CSS never hides anything. Render with `dangerouslySetInnerHTML` and put
 * `suppressHydrationWarning` on `<html>`, whose class it changes.
 */
export const ANIMATIONS_INIT_SCRIPT = 'document.documentElement.classList.add("js-animations")';
