import Link from "next/link";
import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import {
  WHATSAPP_USAGE_DAYS,
  deliveredPercent,
  isBackendFullyConfigured,
  formatCentsUsd,
  formatMicrosUsd,
  parseUsageDays,
  profitMicros,
  sumUsage,
  type WhatsAppUsageCounts,
} from "@workspace/lib/whatsapp/admin";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { FailedMessagesTable, TemplateActions, TemplatePreviewButton, WhatsAppSettingsForm } from "./whatsapp.client";
import {
  loadFailedWhatsAppMessages,
  loadWhatsAppConnection,
  loadWhatsAppSettings,
  loadWhatsAppTemplates,
  loadWhatsAppUsage,
  type WhatsAppLoadError,
} from "./whatsapp.data";
import { BACKEND_ERROR_MESSAGES, WHATSAPP_TABS, cairoTime, num, parseTab, templateStatusTone, type Tone, type WhatsAppTab } from "./whatsapp.lib";

export const dynamic = "force-dynamic";

type Search = { tab?: string; days?: string; page?: string; code?: string };
type SettingsLoad = Awaited<ReturnType<typeof loadWhatsAppSettings>>;

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  danger: "bg-destructive/10 text-destructive",
};

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <Badge className={cn("font-medium", TONE_CLASS[tone])}>{children}</Badge>;
}

function Message({ children, danger }: { children: ReactNode; danger?: boolean }) {
  return (
    <Card>
      <CardContent className={cn("py-10 text-center text-sm", danger ? "text-destructive" : "text-muted-foreground")}>
        {children}
      </CardContent>
    </Card>
  );
}

function LoadError({ error }: { error: WhatsAppLoadError }) {
  return (
    <Message danger>
      {error === "forbidden"
        ? "You don't have permission to see WhatsApp."
        : error === "migration"
          ? "Database migration 0180 not applied. Apply it on this database to use WhatsApp."
          : "WhatsApp could not be loaded. Try again."}
    </Message>
  );
}

/** Owner, 2026-11-26: off until the Meta business account is verified and the number is registered. */
function OffBanner() {
  return (
    <div role="status" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        WhatsApp is off. It stays off until the Meta business account is verified and the number is registered
        (docs/whatsapp-meta-setup.md).
      </span>
    </div>
  );
}

/** Admin › WhatsApp (ROADMAP.md F-109, docs/whatsapp.md §6). Same permission as Billing. Never cached. */
export default async function WhatsAppPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  // The banner shows unless the saved switch is on (also when settings can't load, e.g. no 0180).
  const settings = await loadWhatsAppSettings();
  const isOn = settings.data?.enabled === true;
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">WhatsApp</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Order updates sent to shoppers from the Tallaby number. Tallaby pays Meta; sellers use it for free. Every change here is
          logged.
        </p>
      </div>
      {!isOn && <OffBanner />}
      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b px-1" aria-label="WhatsApp sections">
        {WHATSAPP_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/whatsapp?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm",
              t.key === tab ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <TabContent tab={tab} sp={sp} settings={settings} />
    </div>
  );
}

async function TabContent({ tab, sp, settings }: { tab: WhatsAppTab; sp: Search; settings: SettingsLoad }) {
  switch (tab) {
    case "settings":
      return <SettingsTab result={settings} />;
    case "connection":
      return <ConnectionTab />;
    case "templates":
      return <TemplatesTab />;
    case "usage":
      return <UsageTab days={sp.days} />;
    case "failed":
      return <FailedTab page={sp.page} code={sp.code} />;
  }
}

function SettingsTab({ result }: { result: SettingsLoad }) {
  if (!result.data) return <LoadError error={result.error} />;
  const { updatedAt, updatedBy: _updatedBy, ...settings } = result.data;
  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <WhatsAppSettingsForm initial={settings} />
        <p className="text-xs text-muted-foreground">Last saved: {updatedAt ? cairoTime(updatedAt) : "never (defaults)"}</p>
      </CardContent>
    </Card>
  );
}

const ENV_LABELS = [
  ["token", "WHATSAPP_ACCESS_TOKEN"],
  ["phoneNumberId", "WHATSAPP_PHONE_NUMBER_ID"],
  ["wabaId", "WHATSAPP_WABA_ID"],
  ["appSecret", "WHATSAPP_APP_SECRET"],
  ["verifyToken", "WHATSAPP_VERIFY_TOKEN"],
  ["payloadSecret", "WHATSAPP_PAYLOAD_SECRET"],
] as const;

async function ConnectionTab() {
  const result = await loadWhatsAppConnection();
  if (!result.data) return <LoadError error={result.error} />;
  const connection = result.data;
  if (!connection.ok) return <Message danger>{BACKEND_ERROR_MESSAGES[connection.error]}</Message>;
  const { configured, phone, error } = connection.data;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            Backend env
            <ToneBadge tone={isBackendFullyConfigured(configured) ? "success" : "danger"}>
              {isBackendFullyConfigured(configured) ? "Configured" : "Not configured"}
            </ToneBadge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ENV_LABELS.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-mono text-xs">{label}</span>
              <ToneBadge tone={configured[key] ? "success" : "danger"}>{configured[key] ? "Set" : "Missing"}</ToneBadge>
            </div>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">Only whether each value is set. The values stay in the backend.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phone number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {error && <p className="text-destructive">{error}</p>}
          {!phone ? (
            <p className="text-muted-foreground">Not read from Meta yet.</p>
          ) : (
            <dl className="grid grid-cols-2 gap-3">
              <dt className="text-muted-foreground">Display name</dt>
              <dd>{phone.displayName ?? "—"}</dd>
              <dt className="text-muted-foreground">Name status</dt>
              <dd>{phone.nameStatus ?? "—"}</dd>
              <dt className="text-muted-foreground">Quality rating</dt>
              <dd>
                <ToneBadge tone={phone.qualityRating === "GREEN" ? "success" : phone.qualityRating === "YELLOW" ? "warning" : phone.qualityRating === "RED" ? "danger" : "neutral"}>
                  {phone.qualityRating ?? "—"}
                </ToneBadge>
              </dd>
              <dt className="text-muted-foreground">Messaging limit</dt>
              <dd>{phone.messagingLimit ?? "—"}</dd>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  not_submitted: "Not submitted",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paused: "Paused",
  disabled: "Disabled",
};

async function TemplatesTab() {
  const result = await loadWhatsAppTemplates();
  if (!result.data) return <LoadError error={result.error} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Tallaby&apos;s templates are in code. Submit sends the ones Meta doesn&apos;t have yet; Sync reads every status back.
        </p>
        <TemplateActions />
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Synced</TableHead>
              <TableHead className="text-right">Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((t) => (
              <TableRow key={`${t.name}:${t.language}`}>
                <TableCell className="font-mono text-xs">{t.name}</TableCell>
                <TableCell>{t.language}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>
                  <ToneBadge tone={templateStatusTone(t.status)}>{STATUS_LABEL[t.status] ?? t.status}</ToneBadge>
                </TableCell>
                <TableCell className="max-w-60 text-xs text-muted-foreground">{t.rejectedReason ?? "—"}</TableCell>
                <TableCell className="text-xs">{t.quality ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{cairoTime(t.syncedAt)}</TableCell>
                <TableCell className="text-right">
                  <TemplatePreviewButton name={t.name} language={t.language} preview={t.preview} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-0.5 py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const pct = (c: WhatsAppUsageCounts) => {
  const p = deliveredPercent(c.delivered, c.attempted);
  return p === null ? "—" : `${p}%`;
};

function UsageCells({ c }: { c: WhatsAppUsageCounts }) {
  return (
    <>
      <TableCell className="text-right tabular-nums">{num(c.messages)}</TableCell>
      <TableCell className="text-right tabular-nums">{pct(c)}</TableCell>
      <TableCell className="text-right tabular-nums">{num(c.read)}</TableCell>
      <TableCell className="text-right tabular-nums">{num(c.failed)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMicrosUsd(c.costMicros)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCentsUsd(c.revenueCents)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMicrosUsd(profitMicros(c.revenueCents, c.costMicros))}</TableCell>
      <TableCell className="text-right tabular-nums">
        {num(c.confirms)} / {num(c.cancels)}
      </TableCell>
    </>
  );
}

const USAGE_HEADS = ["Messages", "Delivered", "Read", "Failed", "Meta cost", "Revenue", "Profit", "Confirms / cancels"];

async function UsageTab({ days: daysRaw }: { days?: string }) {
  const days = parseUsageDays(daysRaw);
  const result = await loadWhatsAppUsage(days);
  if (!result.data) return <LoadError error={result.error} />;
  const { perDay, topStores } = result.data;
  const total = sumUsage(perDay);
  return (
    <div className="space-y-5">
      <div className="flex gap-2" role="group" aria-label="Range">
        {WHATSAPP_USAGE_DAYS.map((d) => (
          <Button key={d} asChild size="sm" variant={d === days ? "default" : "outline"}>
            <Link href={`/whatsapp?tab=usage&days=${d}`}>{d} days</Link>
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Fact label="Messages" value={num(total.messages)} />
        <Fact label="Delivered" value={pct(total)} hint={`${num(total.delivered)} of ${num(total.attempted)} sent`} />
        <Fact label="Meta cost" value={formatMicrosUsd(total.costMicros)} />
        <Fact label="Revenue" value={formatCentsUsd(total.revenueCents)} hint="Free for sellers" />
        <Fact label="Profit" value={formatMicrosUsd(profitMicros(total.revenueCents, total.costMicros))} />
        <Fact label="Confirms / cancels" value={`${num(total.confirms)} / ${num(total.cancels)}`} hint="By WhatsApp button" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per day (Cairo)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {perDay.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages in this range.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  {USAGE_HEADS.map((h) => (
                    <TableHead key={h} className="text-right">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {perDay.map((d) => (
                  <TableRow key={d.day}>
                    <TableCell className="whitespace-nowrap">{d.day}</TableCell>
                    <UsageCells c={d} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top stores</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {topStores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No store messages in this range.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  {USAGE_HEADS.map((h) => (
                    <TableHead key={h} className="text-right">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStores.map((s) => (
                  <TableRow key={s.storeId}>
                    <TableCell>
                      <Link href={`/stores/${s.storeId}`} className="hover:underline">
                        {s.storeName ?? s.storeId.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <UsageCells c={s} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function FailedTab({ page, code }: { page?: string; code?: string }) {
  const result = await loadFailedWhatsAppMessages(page, code);
  if (!result.data) return <LoadError error={result.error} />;
  const { rows, total, pageSize, codes } = result.data;
  const current = result.data.page;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const codeParam = code && /^\d+$/.test(code) ? code : "";
  const href = (p: number, c = codeParam) => `/whatsapp?tab=failed${c ? `&code=${c}` : ""}${p > 1 ? `&page=${p}` : ""}`;
  return (
    <div className="space-y-4">
      {codes.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Error code">
          <Button asChild size="sm" variant={codeParam ? "outline" : "default"}>
            <Link href={href(1, "")}>All</Link>
          </Button>
          {codes
            .filter((c) => c.code !== null)
            .map((c) => (
              <Button key={c.code} asChild size="sm" variant={String(c.code) === codeParam ? "default" : "outline"}>
                <Link href={href(1, String(c.code))}>
                  {c.code} · {num(c.count)}
                </Link>
              </Button>
            ))}
        </div>
      )}
      {rows.length === 0 ? (
        <Message>No failed messages.</Message>
      ) : (
        <FailedMessagesTable key={`${current}:${codeParam}`} rows={rows} />
      )}
      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pages">
          <span className="text-muted-foreground tabular-nums">
            Page {current} of {pages} · {num(total)} rows
          </span>
          <div className="flex gap-2">
            <Button asChild={current > 1} variant="outline" size="sm" disabled={current <= 1}>
              {current > 1 ? <Link href={href(current - 1)}>Previous</Link> : <span>Previous</span>}
            </Button>
            <Button asChild={current < pages} variant="outline" size="sm" disabled={current >= pages}>
              {current < pages ? <Link href={href(current + 1)}>Next</Link> : <span>Next</span>}
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
