/* Tallaby seller dashboard service worker (ROADMAP.md F-06): push alerts only.
 * No fetch handler and no caching, so it never changes how pages load. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function text(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** Same-origin dashboard URL only; anything else opens the home page. */
function safeUrl(value) {
  try {
    const url = new URL(typeof value === "string" ? value : "/", self.location.origin);
    return url.origin === self.location.origin ? url.href : new URL("/", self.location.origin).href;
  } catch {
    return new URL("/", self.location.origin).href;
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const lang = data.lang === "en" ? "en" : "ar";
  const title = text(data.title, 120) || (lang === "ar" ? "طلبي" : "Tallaby");
  event.waitUntil(
    self.registration.showNotification(title, {
      body: text(data.body, 300),
      icon: "/logo/logo.png",
      badge: "/logo/logo.png",
      tag: text(data.tag, 64) || undefined,
      lang,
      dir: data.dir === "ltr" ? "ltr" : "rtl",
      data: { url: safeUrl(data.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = safeUrl(event.notification.data && event.notification.data.url);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        if ("navigate" in client) {
          try {
            await client.navigate(target);
          } catch {
            // An uncontrolled tab can't be navigated; open a new one instead.
            await self.clients.openWindow(target);
          }
        }
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
