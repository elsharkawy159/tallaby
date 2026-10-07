"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { FormInputField } from "@/components/forms/form-field";
import { createCoupon, updateCoupon } from "@/actions/coupons";
import {
  couponFormSchema,
  toCouponInput,
  type CouponFormValues,
} from "../../_lib/validations/coupon-schema";
import {
  DISCOUNT_TYPE_LABELS,
  generateCouponCode,
  toDateTimeLocal,
} from "../coupons.lib";
import type { AdminCoupon } from "../coupons.types";

const DISCOUNT_TYPE_OPTIONS = Object.entries(DISCOUNT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

function defaultValues(coupon: AdminCoupon | null): CouponFormValues {
  if (!coupon) {
    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    return {
      code: "",
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minimumPurchase: "",
      maximumDiscount: "",
      usageLimit: "",
      perUserLimit: "",
      isOneTimeUse: false,
      isActive: true,
      startsAt: toDateTimeLocal(startsAt),
      expiresAt: toDateTimeLocal(expiresAt),
    };
  }

  const amount = (value: string | null) => (value === null ? "" : Number(value));
  return {
    code: coupon.code,
    name: coupon.name,
    description: coupon.description ?? "",
    // Legacy buy_x_get_y rows can't be edited into a platform rule; fall back.
    discountType:
      coupon.discountType === "buy_x_get_y" ? "percentage" : coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minimumPurchase: amount(coupon.minimumPurchase),
    maximumDiscount: amount(coupon.maximumDiscount),
    usageLimit: coupon.usageLimit ?? "",
    perUserLimit: coupon.perUserLimit ?? "",
    isOneTimeUse: coupon.isOneTimeUse ?? false,
    isActive: coupon.isActive ?? true,
    startsAt: toDateTimeLocal(coupon.startsAt),
    expiresAt: toDateTimeLocal(coupon.expiresAt),
  };
}

interface CouponFormDialogProps {
  /** null = create. */
  coupon: AdminCoupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function CouponFormDialog({
  coupon,
  open,
  onOpenChange,
  onSaved,
}: CouponFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/* Keyed so the form re-initialises for each coupon opened. */}
        {open && (
          <CouponForm
            key={coupon?.id ?? "new"}
            coupon={coupon}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CouponForm({
  coupon,
  onCancel,
  onSaved,
}: {
  coupon: AdminCoupon | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(coupon);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: defaultValues(coupon),
  });
  const discountType = useWatch({ control: form.control, name: "discountType" });
  const isOneTimeUse = useWatch({ control: form.control, name: "isOneTimeUse" });

  const onSubmit = (values: CouponFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const input = toCouponInput(values);
      const result = coupon
        ? await updateCoupon(coupon.id, input)
        : await createCoupon(input);

      if (!result.success) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Coupon updated" : "Coupon created");
      onSaved();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit coupon" : "Create coupon"}</DialogTitle>
          <DialogDescription>
            Customers enter this code at checkout.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Globe className="size-4" />
          <AlertDescription>
            Applies to all products on Tallaby, from every seller.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="SUMMER20"
                      className="font-mono uppercase"
                      autoComplete="off"
                      onChange={(event) =>
                        field.onChange(event.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      form.setValue("code", generateCouponCode(), {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    aria-label="Generate code"
                    title="Generate code"
                  >
                    <Shuffle className="size-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormInputField
            control={form.control}
            name="name"
            label="Name"
            placeholder="Summer sale"
          />
        </div>

        <FormInputField
          control={form.control}
          name="description"
          label="Description"
          type="textarea"
          placeholder="Internal note or customer-facing description (optional)"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInputField
            control={form.control}
            name="discountType"
            label="Discount type"
            type="select"
            options={DISCOUNT_TYPE_OPTIONS}
          />
          {discountType !== "free_shipping" && (
            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {discountType === "percentage" ? "Discount (%)" : "Discount (EGP)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={discountType === "percentage" ? 100 : undefined}
                      step="any"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === "" ? "" : Number(event.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormInputField
            control={form.control}
            name="minimumPurchase"
            label="Minimum order (EGP)"
            type="number"
            placeholder="No minimum"
          />
          {discountType === "percentage" && (
            <FormInputField
              control={form.control}
              name="maximumDiscount"
              label="Maximum discount (EGP)"
              type="number"
              placeholder="No cap"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInputField
            control={form.control}
            name="usageLimit"
            label="Total uses"
            type="number"
            placeholder="Unlimited"
            description="Across all customers."
          />
          <FormInputField
            control={form.control}
            name="perUserLimit"
            label="Uses per customer"
            type="number"
            placeholder="Unlimited"
            disabled={isOneTimeUse}
            description={isOneTimeUse ? "One-time use is on." : undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(["startsAt", "expiresAt"] as const).map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{name === "startsAt" ? "Starts" : "Expires"}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2">
          <FormInputField
            control={form.control}
            name="isOneTimeUse"
            label="One-time use"
            type="switch"
            placeholder="Each customer can use it once"
          />
          <FormInputField
            control={form.control}
            name="isActive"
            label="Active"
            type="switch"
            placeholder="Customers can redeem it"
          />
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
