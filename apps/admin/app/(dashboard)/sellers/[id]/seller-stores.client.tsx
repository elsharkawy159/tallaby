"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import type { AdminStoreRow } from "@workspace/lib/admin/server";
import { formatDate, formatDateTime } from "../sellers.lib";
import { SITE_STATUS_LABELS, STORE_STATUS_CLASSES } from "./seller-admin.lib";
import { storeAdminAction } from "./seller-admin.server";
import { ReasonField, reasonIsValid } from "./seller-account.client";

type StoreAction = "unpublish_store" | "suspend_store" | "unsuspend_store";

const ACTION_COPY: Record<StoreAction, { label: string; title: string; body: string }> = {
  unpublish_store: {
    label: "Unpublish site",
    title: "Force-unpublish this store's site",
    body: "The storefront falls back to the default Tallaby Classic page. The seller can publish again.",
  },
  suspend_store: {
    label: "Suspend",
    title: "Suspend this store",
    body: "Its storefront stops resolving and the seller cannot edit or publish it. Other stores of this seller are not affected.",
  },
  unsuspend_store: {
    label: "Unsuspend",
    title: "Unsuspend this store",
    body: "The store becomes active again and its published site (if any) is live again.",
  },
};

/** The seller's stores with site status and view-only revisions; single-store actions need a reason (P9-01). */
export function SellerStoresPanel({ sellerId, stores }: { sellerId: string; stores: AdminStoreRow[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [target, setTarget] = useState<{ store: AdminStoreRow; action: StoreAction } | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const openAction = (store: AdminStoreRow, action: StoreAction) => {
    setReason("");
    setTarget({ store, action });
  };

  const submit = () => {
    if (!target) return;
    startTransition(async () => {
      const result = await storeAdminAction({ action: target.action, sellerId, storeId: target.store.id, reason });
      if (result.success) {
        toast.success(result.message);
        setTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card id="stores">
      <CardHeader>
        <CardTitle>Stores ({stores.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {stores.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No stores.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Store</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Site</th>
                <th className="py-2 pr-3 font-medium">Template</th>
                <th className="py-2 pr-3 font-medium">First publish</th>
                <th className="py-2 pr-3 font-medium">Revisions</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => {
                const isOpen = expanded === store.id;
                return (
                  <Fragment key={store.id}>
                    <tr className="border-b align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium">
                          {store.name}
                          {store.isPrimary && <Badge variant="outline" className="ml-2">Primary</Badge>}
                        </div>
                        <a
                          href={`https://${store.host}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                        >
                          {store.host}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {store.customDomain && (
                          <div className="text-xs text-muted-foreground">
                            Custom domain: {store.customDomain} ({store.customDomainStatus})
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge className={STORE_STATUS_CLASSES[store.status] ?? ""}>{store.status}</Badge>
                      </td>
                      <td className="py-2 pr-3">
                        {SITE_STATUS_LABELS[store.siteStatus] ?? store.siteStatus}
                        {store.lastPublishedAt && (
                          <div className="text-xs text-muted-foreground">Last {formatDate(store.lastPublishedAt)}</div>
                        )}
                      </td>
                      <td className="py-2 pr-3">{store.templateKey}</td>
                      <td className="py-2 pr-3">{store.firstPublishedAt ? formatDate(store.firstPublishedAt) : "—"}</td>
                      <td className="py-2 pr-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpanded(isOpen ? null : store.id)}
                          disabled={store.revisionCount === 0}
                        >
                          {isOpen ? <ChevronDown className="mr-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                          {store.revisionCount}
                        </Button>
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          {store.siteStatus === "published" && store.status === "active" && (
                            <Button size="sm" variant="outline" onClick={() => openAction(store, "unpublish_store")}>
                              {ACTION_COPY.unpublish_store.label}
                            </Button>
                          )}
                          {store.status === "suspended" ? (
                            <Button size="sm" variant="outline" onClick={() => openAction(store, "unsuspend_store")}>
                              {ACTION_COPY.unsuspend_store.label}
                            </Button>
                          ) : (
                            <Button size="sm" variant="destructive" onClick={() => openAction(store, "suspend_store")}>
                              {ACTION_COPY.suspend_store.label}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b bg-muted/30">
                        <td colSpan={7} className="px-3 py-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Last {store.revisions.length} revisions (view only)
                          </div>
                          <ul className="divide-y">
                            {store.revisions.map((revision) => (
                              <li key={revision.id} className="flex items-center justify-between py-1.5 text-xs">
                                <span>
                                  #{revision.revisionNumber} · {formatDateTime(revision.createdAt)}
                                  {revision.publishedBy && (
                                    <span className="text-muted-foreground"> · by {revision.publishedBy.slice(0, 8)}</span>
                                  )}
                                </span>
                                {revision.isLive && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Live</Badge>}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>

      <Dialog open={target !== null} onOpenChange={(next) => !next && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target ? ACTION_COPY[target.action].title : ""}</DialogTitle>
            <DialogDescription>
              {target ? `${target.store.name} (${target.store.host}). ${ACTION_COPY[target.action].body}` : ""}
            </DialogDescription>
          </DialogHeader>
          <ReasonField value={reason} onChange={setReason} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={target?.action === "suspend_store" ? "destructive" : "default"}
              onClick={submit}
              disabled={pending || !reasonIsValid(reason)}
            >
              {pending ? "Saving…" : target ? ACTION_COPY[target.action].label : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
