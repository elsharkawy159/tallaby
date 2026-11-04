"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, LoaderCircle, LocateFixed, MapPin, Pencil, Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { CHECKOUT_ADDRESS_MAX, savedAddressLine } from "@workspace/lib/shipping/checkout-address";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping/governorate";
import { cn } from "@workspace/ui/lib/utils";
import type { SavedCheckoutAddress, useCheckoutAddress } from "./use-checkout-address.client";

/**
 * The checkout's one form (ROADMAP.md F-64): name, mobile, country, one line of
 * address with a location button, and the note passed in as children. The
 * governorate picker appears only when the address doesn't say where it is.
 */
export function SimpleCheckoutForm({
  address,
  saved,
  children,
}: {
  address: ReturnType<typeof useCheckoutAddress>;
  saved: SavedCheckoutAddress[];
  children?: ReactNode;
}) {
  const t = useTranslations("checkout.simpleForm");
  const locale = useLocale();
  const [choosing, setChoosing] = useState(false);
  const { values, location } = address;
  const locating = location === "locating";

  const fieldError = (field: "fullName" | "phone" | "address" | "governorate") =>
    address.errorFor(field) ? (
      <p role="alert" className="text-xs text-red-500">
        {t(`errors.${field}`)}
      </p>
    ) : null;

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border border-gray-200 p-0 md:rounded-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-100 px-4 py-3 md:px-6 md:py-5">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 md:text-xl">
          <MapPin className="size-4 md:size-5" aria-hidden />
          {t("title")}
        </CardTitle>
        {saved.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setChoosing(true)}>
            <Pencil className="size-3.5" aria-hidden />
            {t("editAddress")}
          </Button>
        )}
      </div>

      <CardContent className="grid gap-4 p-4 md:p-6">
        <div className="grid gap-1.5">
          <Label htmlFor="checkout-name">{t("fullName")}</Label>
          <Input
            id="checkout-name"
            autoComplete="name"
            maxLength={100}
            value={values.fullName}
            aria-invalid={address.errorFor("fullName") || undefined}
            onChange={(e) => address.setField("fullName", e.target.value)}
            onBlur={() => address.markTouched("fullName")}
          />
          {fieldError("fullName")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="checkout-phone">{t("phone")}</Label>
            <Input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              maxLength={20}
              placeholder="01XXXXXXXXX"
              className="text-start rtl:text-end"
              value={values.phone}
              aria-invalid={address.errorFor("phone") || undefined}
              onChange={(e) => address.setField("phone", e.target.value)}
              onBlur={() => address.markTouched("phone")}
            />
            {fieldError("phone")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="checkout-country">{t("country")}</Label>
            {/* Only Egypt can be delivered to and validated until ROADMAP.md F-61. */}
            <Input id="checkout-country" value={t("egypt")} readOnly aria-readonly className="bg-muted/40" />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="checkout-address">{t("address")}</Label>
          <div className="relative">
            <Input
              id="checkout-address"
              autoComplete="street-address"
              dir="auto"
              maxLength={CHECKOUT_ADDRESS_MAX}
              placeholder={t("addressPlaceholder")}
              className="pe-11"
              value={values.address}
              aria-invalid={address.errorFor("address") || undefined}
              onChange={(e) => address.setField("address", e.target.value)}
              onBlur={() => address.markTouched("address")}
            />
            <button
              type="button"
              onClick={address.detectLocation}
              disabled={locating}
              aria-label={t(locating ? "locating" : "useLocation")}
              title={t(locating ? "locating" : "useLocation")}
              className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-md text-primary outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
            >
              {locating ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden />
              ) : (
                <LocateFixed className="size-5" aria-hidden />
              )}
            </button>
          </div>
          {locating && (
            <p role="status" className="text-xs text-muted-foreground">
              {t("locating")}
            </p>
          )}
          {(location === "denied" || location === "failed") && (
            <p role="status" className="text-xs text-orange-600">
              {t(location === "denied" ? "locationDenied" : "locationFailed")}
            </p>
          )}
          {fieldError("address")}
        </div>

        {address.needsGovernorate && (
          <div className="grid gap-1.5">
            <Label htmlFor="checkout-governorate">{t("governorate")}</Label>
            <Select value={values.governorate} onValueChange={(value) => address.setField("governorate", value)}>
              <SelectTrigger id="checkout-governorate" className="w-full">
                <SelectValue placeholder={t("governoratePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {EGYPT_GOVERNORATES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {getGovernorateLabel(code, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("governorateHint")}</p>
            {fieldError("governorate")}
          </div>
        )}

        {address.saveFailed && (
          <p role="alert" className="text-xs text-red-500">
            {t("saveFailed")}
          </p>
        )}

        {children}
      </CardContent>

      <Dialog open={choosing} onOpenChange={setChoosing}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("chooseAddress")}</DialogTitle>
          </DialogHeader>
          <ul className="grid gap-2">
            {saved.map((item) => {
              const selected = item.id === address.addressId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      address.selectSaved(item);
                      setChoosing(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border-2 p-3 text-start outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary bg-primary/5" : "border-gray-200",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {item.fullName}
                        {item.isDefault && (
                          <span className="ms-2 text-xs font-normal text-muted-foreground">{t("default")}</span>
                        )}
                      </span>
                      <span dir="ltr" className="block text-start text-xs text-muted-foreground rtl:text-end">
                        {item.phone}
                      </span>
                      <span dir="auto" className="mt-0.5 block text-xs text-gray-700">
                        {savedAddressLine(item)}
                      </span>
                    </span>
                    {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              address.startNew();
              setChoosing(false);
            }}
          >
            <Plus className="size-4" aria-hidden />
            {t("newAddress")}
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
