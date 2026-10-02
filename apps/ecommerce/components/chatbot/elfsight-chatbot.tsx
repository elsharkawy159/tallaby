"use client";

import { useEffect } from "react";

const ELFSIGHT_APP_ID = "f5f6fef6-c0f0-41de-b107-072948b80fc4";
const PLATFORM_SRC = "https://elfsightcdn.com/platform.js";

/** Delay before the widget script is requested, so it never touches initial load. */
const LOAD_DELAY_MS = 4000;

/**
 * Any fixed bar docked to the bottom of the viewport (mobile bottom nav,
 * sticky add-to-cart, ...) should carry this attribute. The chat launcher is
 * lifted above the tallest visible one.
 */
export const CHAT_AVOID_ATTR = "data-chat-avoid";
const OFFSET_VAR = "--chat-offset";
const STYLE_ID = "tallaby-chat-offset";

// Elfsight renders its launcher inside an open shadow root, out of reach of
// page CSS. Custom properties do inherit through it, so we inject this rule
// and drive it from <html>.
const LAUNCHER_CSS = `
.es-launcher-floating-container {
  bottom: var(${OFFSET_VAR}, 0px) !important;
}`;

const measureOffset = () => {
  // Fixed elements are laid out against the viewport without scrollbars.
  const vh = document.documentElement.clientHeight;
  let offset = 0;
  document.querySelectorAll<HTMLElement>(`[${CHAT_AVOID_ATTR}]`).forEach((el) => {
    if (getComputedStyle(el).position !== "fixed") return;
    const rect = el.getBoundingClientRect();
    if (rect.height === 0 || rect.top >= vh) return;
    offset = Math.max(offset, vh - rect.top);
  });
  return Math.round(offset);
};

/** Returns true once the launcher's shadow root carries our style. */
const injectLauncherStyle = () => {
  let done = false;
  document
    .querySelectorAll<HTMLElement>(".es-portal-root > *")
    .forEach((host) => {
      const root = host.shadowRoot;
      if (!root) return;
      done = true;
      if (root.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = LAUNCHER_CSS;
      root.appendChild(style);
    });
  return done;
};

/**
 * Elfsight AI Chatbot widget. The script is injected a few seconds after the
 * page has loaded, and the floating launcher is kept above any bottom-docked
 * bars so it never covers navigation or the add-to-cart button.
 */
export function ElfsightChatbot() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let trackUntil = 0;

    const apply = () => {
      root.style.setProperty(OFFSET_VAR, `${measureOffset()}px`);
    };

    // Follow bars while they animate (they slide in/out over ~300ms).
    const track = () => {
      trackUntil = performance.now() + 400;
      if (frame) return;
      const loop = () => {
        apply();
        frame =
          performance.now() < trackUntil ? requestAnimationFrame(loop) : 0;
      };
      frame = requestAnimationFrame(loop);
    };

    // Bars mount/unmount on navigation and the widget renders late; one
    // measurement per frame is enough for those.
    let pending = 0;
    const domObserver = new MutationObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        injectLauncherStyle();
        apply();
      });
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
    // The bottom nav slides in/out by toggling a data attribute on <html>.
    const rootObserver = new MutationObserver(track);
    rootObserver.observe(root, { attributes: true, attributeFilter: ["data-bottom-nav"] });
    window.addEventListener("resize", track);
    apply();

    let timer: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    const load = () => {
      timer = setTimeout(() => {
        if (!document.querySelector(`script[src="${PLATFORM_SRC}"]`)) {
          const script = document.createElement("script");
          script.src = PLATFORM_SRC;
          script.async = true;
          document.body.appendChild(script);
        }
        // The widget attaches its shadow root some time after the script
        // runs, and changes inside it aren't visible to the observer above.
        let attempts = 0;
        poll = setInterval(() => {
          if (injectLauncherStyle() || ++attempts > 120) clearInterval(poll);
        }, 500);
      }, LOAD_DELAY_MS);
    };
    if (document.readyState === "complete") load();
    else window.addEventListener("load", load, { once: true });

    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pending);
      domObserver.disconnect();
      rootObserver.disconnect();
      window.removeEventListener("resize", track);
      window.removeEventListener("load", load);
    };
  }, []);

  return (
    <div className={`elfsight-app-${ELFSIGHT_APP_ID}`} data-elfsight-app-lazy />
  );
}
