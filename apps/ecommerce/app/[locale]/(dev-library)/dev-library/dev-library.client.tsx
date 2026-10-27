"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  DevLibraryData,
  DevSectionItem,
  DevTemplateItem,
} from "./dev-library.types";

type Tab = "all" | "sections" | "templates";
type Device = "desktop" | "mobile";
type Lang = "ar" | "en";
type Theme = "light" | "dark";

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, mobile: 390 };
/** Tallest part of a frame shown on a card (frame px, before scaling). */
const MAX_SECTION_HEIGHT = 2400;

/**
 * Theme › Dark for the library page itself: Tailwind's colours are CSS
 * variables, so the neutral scale is flipped under the root (white cards turn
 * dark, dark text turns light). Frames keep their own document, so previews
 * follow only the store's dark mode.
 */
const LIBRARY_DARK_CSS = `[data-lib-theme="dark"]{color-scheme:dark;
--color-white:oklch(20.5% 0 0);
--color-neutral-50:oklch(23% 0 0);
--color-neutral-100:oklch(14.5% 0 0);
--color-neutral-200:oklch(30% 0 0);
--color-neutral-300:oklch(37.1% 0 0);
--color-neutral-400:oklch(55.6% 0 0);
--color-neutral-500:oklch(70.8% 0 0);
--color-neutral-600:oklch(80% 0 0);
--color-neutral-700:oklch(87% 0 0);
--color-neutral-800:oklch(92.2% 0 0);
--color-neutral-900:oklch(97% 0 0);
--color-blue-700:oklch(70.7% 0.165 254.624);
--color-emerald-100:oklch(26.2% 0.051 172.552);
--color-emerald-800:oklch(84.5% 0.143 164.978);
--color-emerald-600:oklch(76.5% 0.177 163.223);
--color-amber-100:oklch(27.9% 0.077 45.635);
--color-amber-200:oklch(41.4% 0.112 45.904)}`;

type Columns = "1" | "2" | "3" | "4" | "6";
/** Cards per row on a wide screen; narrower screens step down so previews stay readable. */
const COLUMN_CLASS: Record<Columns, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 lg:grid-cols-2",
  "3": "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  "4": "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  "6": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
};
/** The default per preview width: two big desktop previews, or a row of phones. */
const DEFAULT_COLUMNS: Record<Device, Columns> = { desktop: "2", mobile: "4" };
const MAX_TEMPLATE_HEIGHT = 1600;

const prefix = (lang: Lang) => (lang === "en" ? "/en" : "");
const sectionSrc = (id: string, lang: Lang, demo: string, motion: boolean) =>
  `${prefix(lang)}/dev-library/section/${encodeURIComponent(id)}?demo=${encodeURIComponent(demo)}${motion ? "&motion=1" : ""}`;
const templateSrc = (key: string, lang: Lang, slug = "") =>
  `${prefix(lang)}/template-preview/${encodeURIComponent(key)}${slug ? `/${encodeURIComponent(slug)}` : ""}`;

const matches = (query: string, ...values: (string | null | undefined)[]) =>
  !query || values.some((v) => v?.toLowerCase().includes(query));

/**
 * The section and template library (noindex): every code design and template
 * from the working tree, previewed live in scaled frames and grouped by
 * category, with each id and file ready to copy.
 */
export function DevLibrary({ data }: { data: DevLibraryData }) {
  const [tab, setTab] = useState<Tab>("sections");
  const [device, setDeviceState] = useState<Device>("desktop");
  const [cols, setCols] = useState<Columns>(DEFAULT_COLUMNS.desktop);
  const setDevice = (next: Device) => {
    setDeviceState(next);
    setCols(DEFAULT_COLUMNS[next]);
  };
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("dark");
  const [demo, setDemo] = useState(
    data.demoTemplates[0]?.key ?? "tallaby-classic",
  );
  const [motion, setMotion] = useState(false);
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim().toLowerCase());

  const sections = useMemo(
    () =>
      data.sections
        .map((group) => ({
          ...group,
          items: group.items.filter((d) =>
            matches(
              query,
              d.id,
              d.name.en,
              d.name.ar,
              d.subcategory,
              d.file,
              group.id,
              group.name.en,
            ),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [data.sections, query],
  );
  const templates = useMemo(
    () =>
      data.templates
        .map((group) => ({
          ...group,
          items: group.items.filter((t) =>
            matches(query, t.key, t.name.en, t.name.ar, t.folder, group.id),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [data.templates, query],
  );
  const sectionCount = sections.reduce((n, g) => n + g.items.length, 0);
  const templateCount = templates.reduce((n, g) => n + g.items.length, 0);
  const showSections = tab !== "templates";
  const showTemplates = tab !== "sections";
  const columns = COLUMN_CLASS[cols];
  /** The store's dark tokens, applied inside every frame while Theme is Dark (null: light). */
  const dark = theme === "dark" ? data.darkCss : null;

  return (
    <div
      dir="ltr"
      lang="en"
      data-lib-theme={theme}
      className="min-h-screen bg-neutral-100 font-sans text-neutral-900"
    >
      <style>{LIBRARY_DARK_CSS}</style>
      <header className="sticky top-0 z-50 h-24 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="flex h-12 items-center gap-3 overflow-x-auto px-5 pt-1">
          <div className="me-auto shrink-0">
            <h1 className="text-base font-bold leading-tight">
              Section &amp; template library
            </h1>
            <p className="text-xs text-neutral-500">
              Not indexed · live from the code · {sectionCount} sections ·{" "}
              {templateCount} templates
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search id, name, file…"
            className="h-9 w-64 shrink-0 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-900"
          />
          <Toggle
            value={tab}
            onChange={setTab}
            options={[
              ["sections", "Sections"],
              ["templates", "Templates"],
              ["all", "All"],
            ]}
          />
        </div>
        <div className="flex h-12 items-center gap-4 overflow-x-auto px-5 pb-1">
          <Control label="Language">
            <Toggle
              value={lang}
              onChange={setLang}
              options={[
                ["ar", "العربية"],
                ["en", "English"],
              ]}
            />
          </Control>
          <Control label="Theme">
            <Toggle
              value={theme}
              onChange={setTheme}
              options={[
                ["light", "☀ Light"],
                ["dark", "☾ Dark"],
              ]}
            />
          </Control>
          <Control label="Preview">
            <Toggle
              value={device}
              onChange={setDevice}
              options={[
                ["desktop", "Desktop 1280"],
                ["mobile", "Mobile 390"],
              ]}
            />
          </Control>
          <Control label="Columns">
            <Toggle
              value={cols}
              onChange={setCols}
              options={[
                ["1", "1"],
                ["2", "2"],
                ["3", "3"],
                ["4", "4"],
                ["6", "6"],
              ]}
            />
          </Control>
          <Control label="Demo store">
            <select
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              className="h-8 rounded-md border border-neutral-300 px-2 text-xs"
            >
              {data.demoTemplates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name} ({t.key})
                </option>
              ))}
            </select>
          </Control>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={motion}
              onChange={(e) => setMotion(e.target.checked)}
            />
            Motion in section frames
          </label>
        </div>
      </header>

      <div className="flex">
        <Sidebar
          sections={
            showSections
              ? sections.map((g) => ({
                  anchor: `s-${g.id}`,
                  label: g.name.en,
                  count: g.items.length,
                }))
              : []
          }
          templates={
            showTemplates
              ? templates.map((g) => ({
                  anchor: `t-${g.id}`,
                  label: g.id,
                  count: g.items.length,
                }))
              : []
          }
        />

        <main className="min-w-0 flex-1 space-y-12 px-5 py-8">
          {showSections && (
            <section className="space-y-10">
              <h2 className="text-xl font-bold">Sections</h2>
              {sections.map((group) => (
                <section
                  key={group.id}
                  id={`s-${group.id}`}
                  data-group
                  className="scroll-mt-28 space-y-4"
                >
                  <GroupTitle
                    title={`${group.name.en} · ${group.name.ar}`}
                    id={group.id}
                    count={group.items.length}
                  />
                  <div className={`grid gap-5 ${columns}`}>
                    {group.items.map((item) => (
                      <SectionCard
                        key={item.id}
                        item={item}
                        device={device}
                        lang={lang}
                        demo={demo}
                        motion={motion}
                        dark={dark}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </section>
          )}
          {showTemplates && (
            <section className="space-y-10">
              <h2 className="text-xl font-bold">Templates</h2>
              {templates.map((group) => (
                <section
                  key={group.id}
                  id={`t-${group.id}`}
                  data-group
                  className="scroll-mt-28 space-y-4"
                >
                  <GroupTitle
                    title={`Industry: ${group.id}`}
                    id={group.id}
                    count={group.items.length}
                  />
                  <div className={`grid gap-5 ${columns}`}>
                    {group.items.map((item) => (
                      <TemplateCard
                        key={item.key}
                        item={item}
                        device={device}
                        lang={lang}
                        dark={dark}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </section>
          )}
          {!sectionCount && !templateCount && (
            <p className="text-sm text-neutral-500">
              Nothing matches “{search}”.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

type NavItem = { anchor: string; label: string; count: number };

const SIDEBAR_KEY = "dev-library:sidebar";

/**
 * Category links on the left. The whole bar folds to a thin rail, and the
 * Sections and Templates groups fold on their own. The category on screen is
 * highlighted as you scroll.
 */
function Sidebar({
  sections,
  templates,
}: {
  sections: NavItem[];
  templates: NavItem[];
}) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "closed") setOpen(false);
    } catch {}
  }, []);
  const toggle = () =>
    setOpen((was) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, was ? "closed" : "open");
      } catch {}
      return !was;
    });

  const anchors = [...sections, ...templates].map((i) => i.anchor).join(",");
  useEffect(() => {
    const groups = [...document.querySelectorAll<HTMLElement>("[data-group]")];
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-104px 0px -65% 0px" },
    );
    groups.forEach((g) => io.observe(g));
    return () => io.disconnect();
  }, [anchors]);

  // Keep the highlighted link in view inside the bar.
  useEffect(() => {
    if (active)
      document
        .querySelector(`[data-nav="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <aside
      className={`sticky top-24 h-[calc(100vh-6rem)] shrink-0 border-e border-neutral-200 bg-white transition-[width] duration-200 ${open ? "w-64" : "w-11"}`}
    >
      <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          className="flex h-10 shrink-0 items-center gap-2 border-b border-neutral-200 px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          <span
            aria-hidden
            className={`inline-block transition-transform ${open ? "" : "rotate-180"}`}
          >
            «
          </span>
          {open && "Categories"}
        </button>
        {open && (
          <nav className="min-h-0 flex-1 overflow-y-auto py-2 text-[13px]">
            {sections.length > 0 && (
              <NavGroup title="Sections" items={sections} active={active} />
            )}
            {templates.length > 0 && (
              <NavGroup title="Templates" items={templates} active={active} />
            )}
          </nav>
        )}
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  active,
}: {
  title: string;
  items: NavItem[];
  active: string | null;
}) {
  const total = items.reduce((n, i) => n + i.count, 0);
  return (
    <details open className="group/nav">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-900 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-block transition-transform group-open/nav:rotate-90"
        >
          ›
        </span>
        {title}
        <span className="ms-auto font-normal">{total}</span>
      </summary>
      <ul className="pb-2">
        {items.map((item) => (
          <li key={item.anchor}>
            <a
              href={`#${item.anchor}`}
              data-nav={item.anchor}
              className={`flex items-center gap-2 px-3 py-1.5 ps-7 hover:bg-neutral-100 ${active === item.anchor ? "bg-neutral-900 text-white hover:bg-neutral-800" : "text-neutral-700"}`}
            >
              <span className="truncate">{item.label}</span>
              <span
                className={`ms-auto text-[11px] ${active === item.anchor ? "text-neutral-300" : "text-neutral-400"}`}
              >
                {item.count}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Control({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-600">
      <span>{label}</span>
      {children}
    </div>
  );
}

function GroupTitle({
  title,
  id,
  count,
}: {
  title: string;
  id: string;
  count: number;
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-neutral-300 pb-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <Copy text={id} />
      <span className="text-xs text-neutral-500">{count}</span>
    </div>
  );
}

function SectionCard({
  item,
  device,
  lang,
  demo,
  motion,
  dark,
}: {
  item: DevSectionItem;
  device: Device;
  lang: Lang;
  demo: string;
  motion: boolean;
  dark: string | null;
}) {
  const src = sectionSrc(item.id, lang, demo, motion);
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <Frame
        src={src}
        device={device}
        maxHeight={MAX_SECTION_HEIGHT}
        measure="[data-dev-frame]"
        title={item.id}
        dark={dark}
      />
      <div className="space-y-1.5 border-t border-neutral-200 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">
            {item.name.en}{" "}
            <span className="font-normal text-neutral-500">
              · {item.name.ar}
            </span>
          </p>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-medium text-blue-700 hover:underline"
          >
            Open ↗
          </a>
        </div>
        <Copy text={item.id} strong />
        {item.file && <Copy text={item.file} />}
        <p className="text-[11px] text-neutral-500">
          {item.category} › {item.subcategory} · v{item.version}
        </p>
        <IdList
          label={
            item.usedBy.length
              ? `Used in ${item.usedBy.length} template${item.usedBy.length === 1 ? "" : "s"}`
              : "Not used by any template"
          }
          ids={item.usedBy}
        />
      </div>
    </article>
  );
}

function TemplateCard({
  item,
  device,
  lang,
  dark,
}: {
  item: DevTemplateItem;
  device: Device;
  lang: Lang;
  dark: string | null;
}) {
  const [page, setPage] = useState("");
  const src = templateSrc(item.key, lang, page);
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <Frame
        src={src}
        device={device}
        maxHeight={MAX_TEMPLATE_HEIGHT}
        title={item.key}
        dark={dark}
      />
      <div className="space-y-1.5 border-t border-neutral-200 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug">
            {item.name.en}{" "}
            <span className="font-normal text-neutral-500">
              · {item.name.ar}
            </span>
            {item.isDefault && (
              <span className="ms-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800">
                default
              </span>
            )}
          </p>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-medium text-blue-700 hover:underline"
          >
            Open ↗
          </a>
        </div>
        <Copy text={item.key} strong />
        <Copy text={item.folder} />
        <div className="flex flex-wrap items-center gap-1.5">
          {item.palette.map((color) => (
            <span
              key={color}
              title={color}
              className="size-3.5 rounded-full border border-neutral-300"
              style={{ background: color }}
            />
          ))}
          <span className="text-[11px] text-neutral-500">
            v{item.version} · {item.homeSections} home sections
          </span>
        </div>
        <IdList
          label={`Built from ${item.sections.length} sections`}
          ids={item.sections}
        />
        <div className="flex flex-wrap gap-1">
          {item.pages.map((p) => (
            <button
              key={p.slug || "home"}
              type="button"
              onClick={() => setPage(p.slug)}
              className={`rounded px-1.5 py-0.5 text-[11px] ${page === p.slug ? "bg-neutral-900 text-white" : "bg-neutral-100 hover:bg-neutral-200"}`}
            >
              {p.slug ? p.name.en : "Home"}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

/**
 * At most this many frames load at once. Browsers open ~6 connections to the
 * dev server, and hundreds of frames starting together would starve the
 * library page's own scripts (it would never hydrate).
 */
const MAX_LOADING = 4;
let loading = 0;
const waiting: (() => void)[] = [];

/** Queues `start`; the returned release frees the slot (or leaves the queue). Idempotent; a slot frees itself after 20s. */
function acquireSlot(start: () => void): () => void {
  let state: "waiting" | "running" | "done" = "waiting";
  const release = () => {
    if (state === "waiting") waiting.splice(waiting.indexOf(run), 1);
    if (state === "running") {
      loading--;
      waiting.shift()?.();
    }
    state = "done";
  };
  const run = () => {
    state = "running";
    loading++;
    start();
    setTimeout(release, 20_000);
  };
  if (loading < MAX_LOADING) run();
  else waiting.push(run);
  return release;
}

/**
 * A live page in an iframe at real device width, scaled down to the card.
 * Same origin, so it measures the page (or `measure`'s box) and grows to fit,
 * up to `maxHeight`. It loads only near the screen and only after the library
 * has hydrated, a few frames at a time; the skeleton shows until then.
 */
function Frame({
  src,
  device,
  maxHeight,
  measure,
  title,
  dark,
}: {
  src: string;
  device: Device;
  maxHeight: number;
  measure?: string;
  title: string;
  /** The store's dark-mode CSS to switch the page to, or null for light. */
  dark: string | null;
}) {
  const width = DEVICE_WIDTH[device];
  const key = `${src}-${width}`;
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.3);
  const [height, setHeight] = useState(device === "mobile" ? 760 : 720);
  const [loaded, setLoaded] = useState(false);
  const [near, setNear] = useState(false);
  const [granted, setGranted] = useState<string | null>(null);
  const slot = useRef<{ key: string; release: () => void } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(
      ([entry]) => entry && setScale(entry.contentRect.width / width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry && setNear(entry.isIntersecting),
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Ask for a loading slot while near the screen; leave the queue when scrolled away before it starts.
  useEffect(() => {
    if (granted === key) return;
    if (!near) {
      slot.current?.release();
      slot.current = null;
      return;
    }
    if (slot.current?.key === key) return;
    slot.current?.release();
    slot.current = { key, release: acquireSlot(() => setGranted(key)) };
  }, [near, key, granted]);
  useEffect(() => {
    if (loaded) slot.current?.release();
  }, [loaded]);
  useEffect(() => () => slot.current?.release(), []);

  const fit = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    const target = measure ? doc.querySelector<HTMLElement>(measure) : null;
    const h = target
      ? target.getBoundingClientRect().height
      : doc.documentElement.scrollHeight;
    setHeight(Math.min(Math.max(Math.ceil(h), 80), maxHeight));
  }, [maxHeight, measure]);

  const watching = useRef<Document | null>(null);
  const onLoad = useCallback(() => {
    const win = frame.current?.contentWindow as
      (Window & typeof globalThis) | null;
    const doc = frame.current?.contentDocument;
    if (!win || !doc?.body || doc.location.href === "about:blank") return;
    setLoaded(true);
    fit();
    if (watching.current === doc) return;
    watching.current = doc;
    // The Next.js dev badge would sit on every small preview.
    const style = doc.createElement("style");
    style.textContent = "nextjs-portal{display:none!important}";
    doc.head.append(style);
    // Images and fonts arrive later: keep fitting while the page settles.
    const ro = new win.ResizeObserver(() => fit());
    ro.observe(doc.body);
    win.addEventListener("pagehide", () => ro.disconnect(), { once: true });
  }, [fit]);

  // Theme › Dark: the store's own dark mode (as its theme toggle sets it), on every site root in the frame.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!loaded || !doc?.head) return;
    let style = doc.getElementById("dev-library-dark");
    if (dark && !style) {
      style = doc.createElement("style");
      style.id = "dev-library-dark";
      style.textContent = dark;
      doc.head.append(style);
    }
    doc.querySelectorAll(".sf-site").forEach((root) => {
      if (dark) root.setAttribute("data-sf-theme", "dark");
      else root.removeAttribute("data-sf-theme");
    });
  }, [dark, loaded]);

  // `load` can come very late on a streamed page: attach as soon as the frame has its page.
  // A new src (language, demo store, page) starts again.
  useEffect(() => {
    setLoaded(false);
    watching.current = null;
    if (granted !== key) return;
    const timer = setInterval(() => {
      const doc = frame.current?.contentDocument;
      if (doc && watching.current === doc) return clearInterval(timer);
      if (doc?.body?.childElementCount && doc.location.href !== "about:blank")
        onLoad();
    }, 500);
    return () => clearInterval(timer);
  }, [key, granted, onLoad]);

  return (
    <div
      ref={box}
      className="relative w-full overflow-hidden bg-neutral-50"
      style={{ height: Math.round(height * scale) }}
    >
      <FrameSkeleton
        visible={!loaded}
        mobile={device === "mobile"}
        label={title}
      />
      {granted === key && (
        <iframe
          ref={frame}
          key={key}
          src={src}
          title={title}
          onLoad={onLoad}
          tabIndex={-1}
          className={`pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ width, height, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}

/**
 * A page-shaped placeholder while a frame loads (or until it scrolls near the
 * screen): a bar, a heading and a row of cards, shimmering. It fades out once
 * the page inside has drawn.
 */
function FrameSkeleton({
  visible,
  mobile,
  label,
}: {
  visible: boolean;
  mobile: boolean;
  label: string;
}) {
  const bar = "rounded bg-neutral-200";
  return (
    <div
      aria-hidden={!visible}
      role={visible ? "status" : undefined}
      aria-label={visible ? `Loading ${label}` : undefined}
      className={`absolute inset-0 z-10 flex flex-col gap-[6%] overflow-hidden bg-white p-[5%] transition-opacity duration-300 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="flex animate-pulse flex-col gap-[6%] h-full">
        <div className="flex items-center justify-between gap-3">
          <div className={`${bar} h-2.5 w-1/5`} />
          <div className="flex gap-2">
            <div className={`${bar} h-2.5 w-8`} />
            <div className={`${bar} h-2.5 w-8`} />
            {!mobile && <div className={`${bar} h-2.5 w-8`} />}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`${bar} h-4 w-1/2`} />
          <div className={`${bar} h-2.5 w-1/3 bg-neutral-100`} />
        </div>
        <div
          className={`grid min-h-0 flex-1 gap-3 ${mobile ? "grid-cols-2" : "grid-cols-4"}`}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex min-h-0 flex-col gap-2">
              <div className="min-h-0 flex-1 rounded-md bg-neutral-100" />
              <div className={`${bar} h-2 w-3/4`} />
              <div className={`${bar} h-2 w-1/3 bg-neutral-100`} />
            </div>
          ))}
        </div>
      </div>
      <span className="absolute bottom-2 start-3 font-mono text-[10px] text-neutral-400">
        {label}
      </span>
    </div>
  );
}

/** A folded list of ids (templates using a section, sections of a template), each one click to copy. */
function IdList({ label, ids }: { label: string; ids: string[] }) {
  if (!ids.length)
    return <p className="text-[11px] text-neutral-400">{label}</p>;
  return (
    <details className="group/ids text-[11px]">
      <summary className="cursor-pointer list-none text-neutral-600 hover:text-neutral-900 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="me-1 inline-block transition-transform group-open/ids:rotate-90"
        >
          ›
        </span>
        {label}
      </summary>
      <div className="mt-1 flex flex-wrap gap-1">
        {ids.map((id) => (
          <Copy key={id} text={id} />
        ))}
      </div>
    </details>
  );
}

function Copy({ text, strong = false }: { text: string; strong?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Copy"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
      className={`group flex max-w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-start font-mono hover:bg-neutral-100 ${strong ? "text-[13px] font-semibold text-neutral-900" : "text-[11px] text-neutral-600"}`}
    >
      <span className="truncate">{text}</span>
      <span
        className={`shrink-0 text-[10px] ${done ? "text-emerald-600" : "text-neutral-400 group-hover:text-neutral-700"}`}
      >
        {done ? "copied" : "copy"}
      </span>
    </button>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex shrink-0 rounded-md border border-neutral-300 p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium ${value === v ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
