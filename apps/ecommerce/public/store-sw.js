/*
 * Store app service worker (ROADMAP.md F-36d). Registered on store hosts by
 * the footer's Download application button. It caches NOTHING: every request
 * goes to the network as before (never a cached cart, checkout, order or
 * account page, CLAUDE.md rule 8). Only when a page navigation fails because
 * the phone is offline does it answer with a small bilingual offline page.
 */
const OFFLINE_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>غير متصل · Offline</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;background:#fff;color:#111827;text-align:center;padding:24px}
  .box{max-width:340px}
  h1{font-size:20px;margin:16px 0 8px}
  p{color:#6b7280;margin:0 0 4px;line-height:1.6}
  button{margin-top:20px;border:0;border-radius:999px;background:#111827;color:#fff;font-size:15px;padding:12px 24px}
</style>
</head>
<body>
<div class="box">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.8"/><path d="M19 12.9a10 10 0 0 0-2.3-1.6"/><path d="M2 8.8a15 15 0 0 1 4.2-2.7"/><path d="M22 8.8a15 15 0 0 0-11.3-3.8"/><path d="m2 2 20 20"/></svg>
  <h1>أنت غير متصل بالإنترنت</h1>
  <p>تأكد من الاتصال ثم حاول مرة أخرى.</p>
  <p dir="ltr">You're offline. Check your connection and try again.</p>
  <button type="button" onclick="location.reload()">حاول مرة أخرى · Try again</button>
</div>
</body>
</html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  event.respondWith(
    fetch(request).catch(
      () => new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }),
    ),
  );
});
