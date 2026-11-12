"use client";
import { useTransition, useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardTitle,
} from "@workspace/ui/components/card";
import { Form, FormField } from "@workspace/ui/components/form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { useForm } from "react-hook-form";
import {
  CheckoutFormData,
  checkoutFormDefaults,
  createCheckoutFormSchema,
} from "./checkout-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseOptionalOrderEmail } from "@workspace/lib/orders/notification-email";
import { createOrder } from "@/actions/order";
import { recalculateCheckoutSummary } from "@/actions/checkout";
import { saveCheckoutLead } from "@/actions/checkout-lead";
import { trackStoreLead } from "@/components/meta/meta-lead.client";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { cartMinOrderIssues } from "@/lib/cart-min-order.lib";
import { updateCartItem } from "@/actions/cart";
import { SimpleCheckoutForm } from "./simple-checkout-form.client";
import { useCheckoutAddress, type CheckoutCountries, type SavedCheckoutAddress } from "./use-checkout-address.client";
import { isAddressInCountries } from "@workspace/lib/shipping/store-quote";
import { CreditCard, ArrowLeft, Banknote } from "lucide-react";
import { OrderSummary } from "@/components/order-summary";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import type { CheckoutSummary } from "@/lib/coupon-utils";
import { useCart } from "@/providers/cart-provider";
import { formatPriceMarked, formatPricePlain } from "@workspace/lib";
import { PriceText } from "@/components/storefront/price-text";
import {
  getPaymentGroupForMethod,
  isCodEligibleForShipping,
  isWalletEligibleForTotal,
  isWalletPartialPaymentMethod,
  toWalletPartialPaymentMethod,
} from "@workspace/lib/orders/payment";
import {
  ALL_MANUAL_PAYMENT_METHODS,
  MANUAL_PAYMENT_METHODS,
  DEFAULT_MANUAL_PAYMENT_METHOD,
  isManualPaymentMethod,
} from "@/lib/manual-payment-methods";
import type { StorefrontCheckoutPayments } from "@workspace/lib/payments/store-methods";
import { splitDeposit } from "@workspace/lib/orders/cod-deposit";
import {
  applyCheckoutAnswers,
  isDefaultCheckoutForm,
  type CheckoutAnswersError,
  type CheckoutFieldKey,
  type StoreCheckoutForm,
} from "@workspace/lib/stores/checkout-form";
import { StoreCheckoutFields, type StoreCheckoutAnswers } from "./store-checkout-fields.client";
import { checkMinOrder, itemsSubtotalPiastres, type StoreMinOrder } from "@workspace/lib/stores/min-order";
import { useCurrencyLabel } from "@/lib/currency-label.client";

/** Card brands beside "Pay by card" (120×80 card artwork in public/icons/payments). */
const CARD_LOGOS = [
  { src: "/icons/payments/visa.svg", alt: "Visa", card: true },
  { src: "/icons/payments/mastercard.svg", alt: "Mastercard", card: true },
  { src: "/icons/payments/meeza.svg", alt: "Meeza", card: true },
];

export const CheckoutData = ({
  checkoutData,
  addresses: initialAddresses = [],
  defaultAddress: initialDefaultAddress = null,
  isLoggedIn = false,
}: {
  checkoutData: any;
  addresses?: any[];
  defaultAddress?: any;
  isLoggedIn?: boolean;
}) => {
  const { cart, summary: initialSummary } = checkoutData;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { refreshCart } = useCart();
  const [summary, setSummary] = useState<CheckoutSummary>({
    ...initialSummary,
    discountAmount: initialSummary.discountAmount ?? 0,
    shippingDiscount: initialSummary.shippingDiscount ?? 0,
    totalAfterDiscount:
      initialSummary.totalAfterDiscount ??
      Math.max(
        0,
        (initialSummary.total ?? 0) - (initialSummary.shippingDiscount ?? 0),
      ),
    appliedCoupon: initialSummary.appliedCoupon ?? null,
  });
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    name: string;
    discountType: string;
    discountValue?: string | number;
  } | null>(initialSummary.appliedCoupon ?? null);
  const [isRecalculatingShipping, setIsRecalculatingShipping] = useState(false);

  // A store selling abroad: only addresses in the countries it offers apply.
  const addressCountries: CheckoutCountries = checkoutData.addressCountries ?? null;
  const usableAddresses: any[] = addressCountries
    ? initialAddresses.filter((a) => isAddressInCountries(a, addressCountries.options))
    : initialAddresses;
  const usableDefault = addressCountries
    ? (usableAddresses.find((a) => a.isDefault) ?? null)
    : initialDefaultAddress;
  const [savedAddresses, setSavedAddresses] = useState<SavedCheckoutAddress[]>(usableAddresses);
  const [cartLines, setCartLines] = useState<any[]>(cart?.cartItems ?? []);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const orderEmailField: { lastEmail: string | null } | null = checkoutData.orderEmail ?? null;
  const [orderEmail, setOrderEmail] = useState<string>(orderEmailField?.lastEmail ?? "");
  const [orderEmailInvalid, setOrderEmailInvalid] = useState(false);
  // Bumped when the saved address or the cart changes, to price the order again.
  const [priceRevision, setPriceRevision] = useState(0);

  // The default address fills the form, else the newest one saved.
  const activeAddress: SavedCheckoutAddress | null =
    usableDefault || usableAddresses[0] || null;

  const t = useTranslations("checkout");
  const tToast = useTranslations("toast");
  const locale = useLocale();
  const currencyLabel = useCurrencyLabel();

  const checkoutFormSchema = useMemo(
    () => createCheckoutFormSchema((key: string) => t(key as any)),
    [t]
  );

  // Storefront: only the store's enabled methods (Store settings › Payment
  // methods); null on the marketplace, which offers everything.
  const storePayments: StorefrontCheckoutPayments | null =
    checkoutData.storePayments ?? null;
  const codAllowed =
    !storePayments || storePayments.methods.includes("cash_on_delivery");
  const manualMethods = useMemo(
    () =>
      storePayments
        ? ALL_MANUAL_PAYMENT_METHODS.filter((m) =>
            (storePayments.methods as string[]).includes(m.value),
          )
        : MANUAL_PAYMENT_METHODS,
    [storePayments],
  );
  // The seller's default (Store settings › Payment methods), while the store offers it.
  const sellerDefault = storePayments?.defaultMethod ?? null;
  const defaultManualMethod: string = storePayments
    ? (manualMethods.find((m) => m.value === sellerDefault)?.value ?? manualMethods[0]?.value ?? "")
    : DEFAULT_MANUAL_PAYMENT_METHOD;
  // What to fall back to when cash on delivery can't be used: a transfer, else the card.
  const nonCodFallback: string =
    defaultManualMethod || (checkoutData.onlineCardPaymentEnabled ? "online_payment" : "");

  // Storefront: the store's checkout form (F-25a). Null keeps today's
  // checkout exactly: the optional order notes box and nothing else.
  const storeCheckoutForm: StoreCheckoutForm | null =
    checkoutData.storeCheckoutForm && !isDefaultCheckoutForm(checkoutData.storeCheckoutForm)
      ? checkoutData.storeCheckoutForm
      : null;
  const [checkoutAnswers, setCheckoutAnswers] = useState<StoreCheckoutAnswers>({
    email: "",
    secondPhone: "",
    customAnswer: "",
  });
  const [checkoutAnswersError, setCheckoutAnswersError] = useState<{
    field: CheckoutFieldKey;
    error: CheckoutAnswersError;
  } | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onChange",
    defaultValues: {
      ...checkoutFormDefaults,
      shippingAddressId: activeAddress?.id || "",
      paymentMethod: sellerDefault ?? (codAllowed ? "cash_on_delivery" : nonCodFallback),
      couponCode: initialSummary.appliedCoupon?.code ?? "",
    },
  });

  const shippingAddressId = form.watch("shippingAddressId");
  const paymentMethod = form.watch("paymentMethod");

  const address = useCheckoutAddress({
    initial: activeAddress,
    countries: addressCountries,
    prefill: { fullName: checkoutData.customer?.fullName, phone: checkoutData.customer?.phone },
    onSaved: (saved) => {
      form.setValue("shippingAddressId", saved.id, { shouldDirty: true });
      setSavedAddresses((list) => {
        const current = list.find((a) => a.id === saved.id);
        const merged = { ...current, ...saved, addressLine2: saved.addressLine2 ?? null };
        return current ? list.map((a) => (a.id === saved.id ? merged : a)) : [merged, ...list];
      });
      setPriceRevision((n) => n + 1);
    },
    onCleared: () => {
      form.setValue("shippingAddressId", "", { shouldDirty: true });
      setPriceRevision((n) => n + 1);
    },
  });

  // Store websites: once there is a shipping address, save it as a missed
  // order lead (F-03) so the seller can follow up if no order is placed.
  // The server takes the store from the host and the cart from the session.
  const isStorefront = Boolean(storePayments);
  useEffect(() => {
    if (!isStorefront || !shippingAddressId) return;
    const timer = setTimeout(() => {
      void saveCheckoutLead({ addressId: shippingAddressId }).then(trackStoreLead, () => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [isStorefront, shippingAddressId, priceRevision]);

  // Store websites: the seller's zones may not cover the chosen address.
  const storeShipping = summary.storeShipping ?? null;
  const shippingRefusal =
    storeShipping?.kind === "not_covered"
      ? t("notDeliveredHere")
      : storeShipping?.kind === "outside_egypt"
        ? t("egyptOnly")
        : null;
  const isZoneShipping = storeShipping?.kind === "zone";
  const isForeignCurrency = (checkoutData.currency ?? "EGP") !== "EGP";

  // Store websites: the store's minimum order (F-13b), on the items subtotal
  // before shipping and coupons, in piastres (createOrder checks it again).
  const minOrderCheck = checkMinOrder(
    (checkoutData.storeMinOrder as StoreMinOrder | null | undefined) ?? null,
    itemsSubtotalPiastres(cartLines),
  );
  const minOrderMessage = minOrderCheck.ok
    ? null
    : t("minOrderAddMore", {
        amount: formatPriceMarked(minOrderCheck.shortPiastres / 100, locale, currencyLabel),
        minimum: formatPriceMarked(minOrderCheck.minimumPiastres / 100, locale, currencyLabel),
      });

  // The address is checked and saved when the button is pressed, so its errors show then.
  // The same check as `noMethodInCurrency` below, before the shipping rules are worked out.
  // Only a store that offers nothing but cash on delivery is stuck when COD can't be used.
  const offersOtherThanCod = Boolean(storePayments?.methods.some((m) => m !== "cash_on_delivery"));
  const noMethodInCurrencyEarly = !offersOtherThanCod && (!codAllowed || (isZoneShipping && storeShipping?.codEnabled !== true));
  // Under a product's minimum (0151): named here, and refused again by the order.
  const minOrderIssues = cartMinOrderIssues(cartLines, checkoutData.crossSellLineIds ?? []);
  const canPlaceOrder = Boolean(
    paymentMethod?.trim() && !shippingRefusal && minOrderCheck.ok && minOrderIssues.length === 0 && !busyItemId && (!isForeignCurrency || !noMethodInCurrencyEarly)
  );

  useEffect(() => {
    const addressId = shippingAddressId;
    if (!addressId && priceRevision === 0) {
      setSummary((prev) => {
        const billedShipping = 0;
        const total = prev.subtotal + prev.tax + billedShipping;
        const totalAfterDiscount = Math.max(
          0,
          total - (prev.discountAmount ?? 0),
        );

        return {
          ...prev,
          shippingCost: null,
          shippingDiscount: 0,
          total,
          totalAfterDiscount,
          storeShipping: null,
        };
      });
      return;
    }

    let cancelled = false;

    const recalculateSummary = async () => {
      setIsRecalculatingShipping(true);

      try {
        const result = await recalculateCheckoutSummary({
          shippingAddressId: addressId,
          couponCode: appliedCoupon?.code,
        });

        if (cancelled || !result.success || !result.data?.summary) {
          return;
        }

        setSummary(result.data.summary);

        if (result.data.summary.appliedCoupon) {
          setAppliedCoupon(result.data.summary.appliedCoupon);
          form.setValue("couponCode", result.data.summary.appliedCoupon.code);
        } else if (appliedCoupon?.code) {
          // A changed count can take the order out of the coupon's rules.
          setAppliedCoupon(null);
          form.setValue("couponCode", "");
          toast.info(t("simpleForm.couponRemoved"));
        }
      } catch (error) {
        console.error("Failed to recalculate shipping:", error);
      } finally {
        if (!cancelled) {
          setIsRecalculatingShipping(false);
        }
      }
    };

    void recalculateSummary();

    return () => {
      cancelled = true;
    };
  }, [shippingAddressId, priceRevision, appliedCoupon?.code, form, t]);

  const billedShipping = Math.max(
    0,
    (summary.shippingCost ?? 0) - (summary.shippingDiscount ?? 0),
  );
  // A seller zone decides COD itself; the 90 EGP cap is a Tallaby-rider rule.
  const isCodEligibleShipping = isZoneShipping
    ? storeShipping?.codEnabled === true
    : isCodEligibleForShipping(
        summary.shippingCost == null ? null : billedShipping,
      );
  const isCodWithinStoreMax =
    storePayments?.codMaxOrder == null ||
    (summary.totalAfterDiscount ?? summary.total) <= storePayments.codMaxOrder;
  const isCodEligible = isCodEligibleShipping && isCodWithinStoreMax;
  // In another currency the store's own methods pay (card gateway, transfers); stuck only with COD alone and unusable.
  const noMethodInCurrency = isForeignCurrency && !offersOtherThanCod && (!codAllowed || !isCodEligible);

  // Cash on delivery with a deposit (ROADMAP.md F-21): shown under the total and
  // on the option. The server works it out again from its own total.
  const codDeposit = storePayments?.deposit ?? null;
  const depositRows = useMemo(() => {
    if (!codDeposit || paymentMethod !== "cash_on_delivery") return null;
    const split = splitDeposit(summary.totalAfterDiscount ?? summary.total ?? 0, codDeposit.percent);
    return split.depositPiastres > 0
      ? { amount: split.depositPiastres / 100, remainder: split.remainderPiastres / 100, percent: codDeposit.percent }
      : null;
  }, [codDeposit, paymentMethod, summary.totalAfterDiscount, summary.total]);

  const walletAvailableBalance =
    checkoutData.walletAvailableBalance != null
      ? Number(checkoutData.walletAvailableBalance)
      : null;
  const hasWallet = walletAvailableBalance != null && walletAvailableBalance > 0;
  const isWalletEligible = isWalletEligibleForTotal(
    walletAvailableBalance,
    summary.totalAfterDiscount ?? summary.total
  );

  useEffect(() => {
    if (!isCodEligible && form.getValues("paymentMethod") === "cash_on_delivery") {
      form.setValue("paymentMethod", nonCodFallback, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [isCodEligible, nonCodFallback, form]);

  useEffect(() => {
    const current = form.getValues("paymentMethod");
    if (current === "wallet" && !isWalletEligible && hasWallet) {
      form.setValue(
        "paymentMethod",
        toWalletPartialPaymentMethod(DEFAULT_MANUAL_PAYMENT_METHOD),
        { shouldValidate: true, shouldDirty: true },
      );
      return;
    }
    if (isWalletPartialPaymentMethod(current) && isWalletEligible) {
      form.setValue("paymentMethod", "wallet", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [isWalletEligible, hasWallet, form]);

  const onlineCardPaymentEnabled = Boolean(
    checkoutData.onlineCardPaymentEnabled,
  );

  useEffect(() => {
    if (
      !onlineCardPaymentEnabled &&
      form.getValues("paymentMethod") === "online_payment"
    ) {
      form.setValue("paymentMethod", DEFAULT_MANUAL_PAYMENT_METHOD, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [onlineCardPaymentEnabled, form]);

  const walletBalanceLabel =
    walletAvailableBalance != null
      ? formatPricePlain(walletAvailableBalance, locale)
      : "";

  const paymentGroups = useMemo(() => {
    const groups: {
      id: string;
      value: string;
      title: string;
      description: string;
      enabled: boolean;
      disabledLabel?: string;
      /** Brand logos beside the title: card brands, or the store's transfer methods. */
      logos?: { src: string; alt: string; card?: boolean }[];
      cash?: boolean;
    }[] = [
      ...(codAllowed
        ? [
            {
              id: "cash_on_delivery",
              value: "cash_on_delivery",
              title: t("cashOnDelivery"),
              description: [
                storePayments?.codNote || t("cashOnDeliveryDescription"),
                codDeposit ? t("deposit.codOptionNote", { percent: codDeposit.percent }) : null,
              ]
                .filter(Boolean)
                .join(" · "),
              enabled: isCodEligible,
              disabledLabel: !isCodEligibleShipping
                ? isZoneShipping
                  ? t("zoneNoCod")
                  : t("codUnavailableHighShipping")
                : !isCodWithinStoreMax
                  ? t("codUnavailableAboveMax")
                  : undefined,
              cash: true,
            },
          ]
        : []),
      ...(onlineCardPaymentEnabled
        ? [
            {
              id: "online_payment",
              value: "online_payment",
              title: t("payByCard"),
              description: t("payByCardDescription"),
              enabled: true,
              logos: CARD_LOGOS,
            },
          ]
        : []),
      ...(manualMethods.length > 0
        ? [
            {
              id: "online_manual",
              value: "online_manual",
              title: t("onlinePayment"),
              description: storePayments
                ? manualMethods.map((m) => t(m.titleKey as any)).join(" · ")
                : t("onlinePaymentDescription"),
              enabled: true,
              logos: manualMethods.map((m) => ({ src: m.logo, alt: t(m.titleKey as any) })),
            },
          ]
        : []),
    ];

    if (hasWallet) {
      groups.push({
        id: "wallet",
        value: "wallet",
        title: t("walletBalance"),
        description: isWalletEligible
          ? t("walletBalanceDescription")
          : t("walletPartialPaymentDescription", { amount: walletBalanceLabel }),
        enabled: true,
      });
    }

    return groups;
  }, [
    codDeposit,
    onlineCardPaymentEnabled,
    codAllowed,
    isCodEligible,
    isCodEligibleShipping,
    isCodWithinStoreMax,
    isZoneShipping,
    storePayments,
    manualMethods,
    hasWallet,
    isWalletEligible,
    walletBalanceLabel,
    t,
  ]);

  const selectedGroup = getPaymentGroupForMethod(paymentMethod);

  const handleGroupChange = (group: string) => {
    if (group === "online_manual") {
      form.setValue("paymentMethod", defaultManualMethod, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return;
    }

    if (group === "wallet") {
      form.setValue(
        "paymentMethod",
        isWalletEligible
          ? "wallet"
          : toWalletPartialPaymentMethod(DEFAULT_MANUAL_PAYMENT_METHOD),
        { shouldValidate: true, shouldDirty: true },
      );
      return;
    }

    form.setValue("paymentMethod", group, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleSubmit = (data: CheckoutFormData) => {
    if (orderEmailField && !parseOptionalOrderEmail(orderEmail).ok) {
      setOrderEmailInvalid(true);
      toast.error(t("simpleForm.fixForm"));
      return;
    }
    if (storeCheckoutForm) {
      // The same check the server runs, for an instant message.
      const checked = applyCheckoutAnswers(storeCheckoutForm, { ...checkoutAnswers, notes: data.notes });
      if (!checked.ok) {
        setCheckoutAnswersError({ field: checked.field, error: checked.error });
        return;
      }
      setCheckoutAnswersError(null);
    }
    startTransition(async () => {
      try {
        // The address goes in first; everything after this works from its row.
        const addressId = await address.ensureSaved();
        if (!addressId) {
          toast.error(t("simpleForm.fixForm"));
          return;
        }
        const result = await createOrder({
          cartId: cart.id,
          shippingAddressId: addressId,
          billingAddressId: addressId,
          paymentMethod: data.paymentMethod,
          couponCode: data.couponCode,
          notes: data.notes,
          isGift: data.isGift,
          giftMessage: data.giftMessage,
          ...(storeCheckoutForm && { checkoutAnswers }),
          ...(orderEmailField && { notificationEmail: orderEmail }),
        });

        if (result.success) {
          toast.success(tToast("orderPlacedSuccessfully"));
          await refreshCart();
          router.refresh();

          // A COD order with a deposit (F-21) goes straight to paying the deposit.
          const orderDeposit = (result.data?.order as { depositStatus?: string | null } | undefined)?.depositStatus;
          if (
            orderDeposit === "awaiting" ||
            data.paymentMethod === "online_payment" ||
            isManualPaymentMethod(data.paymentMethod) ||
            isWalletPartialPaymentMethod(data.paymentMethod)
          ) {
            router.push(`/cart/checkout/payment?orderId=${result.data?.order?.id}`);
            return;
          }

          router.push(result.data?.orderPagePath ?? `/orders/${result.data?.order?.id}`);
        } else {
          toast.error(result.error || tToast("failedToPlaceOrder"));
        }
      } catch (error) {
        console.error("Checkout submission error:", error);
        toast.error(tToast("somethingWentWrong"));
      }
    });
  };

  // Item counts: the server checks stock and the summary is priced again.
  const handleQuantityChange = async (item: { id: string }, quantity: number) => {
    if (busyItemId) return;
    setBusyItemId(item.id);
    try {
      const result = await updateCartItem(item.id, quantity);
      if (!result.success) {
        if ("minimum" in result) toast.error(result.error);
        else toast.error(t(result.error === "Insufficient stock" ? "simpleForm.notEnoughStock" : "simpleForm.itemNotSaved"));
        return;
      }
      await refreshCart();
      // Fewer items can take the cart below a free gift's amount: the server removed it.
      const removedGifts = (result as { removedGiftIds?: string[] }).removedGiftIds ?? [];
      const next = (
        quantity <= 0
          ? cartLines.filter((line) => line.id !== item.id)
          : cartLines.map((line) => (line.id === item.id ? { ...line, quantity } : line))
      ).filter((line) => !removedGifts.includes(line.id));
      if (next.length === 0) {
        router.push("/cart");
        return;
      }
      setCartLines(next);
      setPriceRevision((n) => n + 1);
    } catch {
      toast.error(t("simpleForm.itemNotSaved"));
    } finally {
      setBusyItemId(null);
    }
  };

  const noteField = (
    <div className="grid gap-1.5">
      <Label htmlFor="notes">{t("orderNotes")}</Label>
      <FormField
        control={form.control as any}
        name="notes"
        render={({ field }) => (
          <Textarea
            {...field}
            id="notes"
            placeholder={t("specialInstructions")}
            rows={2}
            className="w-full resize-none"
          />
        )}
      />
      {form.formState.errors.notes && (
        <p className="text-xs md:text-sm text-red-500">{form.formState.errors.notes.message}</p>
      )}
    </div>
  );

  const handleCouponApplied = useCallback(
    (data: {
      coupon: {
        code: string;
        name: string;
        discountType: string;
        discountValue?: string | number;
      };
      summary: CheckoutSummary;
    }) => {
      setAppliedCoupon(data.coupon);
      setSummary(data.summary);
      form.setValue("couponCode", data.coupon.code);
    },
    [form]
  );

  const handleCouponRemoved = useCallback(
    (newSummary: CheckoutSummary) => {
      setAppliedCoupon(null);
      setSummary(newSummary);
      form.setValue("couponCode", "");
    },
    [form]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 md:gap-8 lg:gap-12">
          {/* Shipping Information */}
          <div className="space-y-4 md:space-y-6">
            <SimpleCheckoutForm
              address={address}
              saved={savedAddresses}
              email={
                orderEmailField
                  ? {
                      value: orderEmail,
                      invalid: orderEmailInvalid,
                      onChange: (value) => {
                        setOrderEmail(value);
                        setOrderEmailInvalid(false);
                      },
                    }
                  : null
              }
            >
              {!storeCheckoutForm && noteField}
            </SimpleCheckoutForm>
            {isStorefront && (
              <p className="-mt-2 px-1 text-xs text-gray-500 md:-mt-4">{t("leadConsent")}</p>
            )}

            {/* Payment Method */}
            <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden pt-0">
              <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5" />{" "}
                  {t("paymentMethod")}
                </CardTitle>
              </div>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <div className="w-full space-y-4">
                      <FieldGroup>
                        <FieldSet>
                          <RadioGroup
                            value={selectedGroup}
                            onValueChange={handleGroupChange}
                            className="flex flex-col items-stretch gap-3 w-full"
                          >
                            {paymentGroups.map((method) => (
                              <div key={method.id} className="space-y-2">
                                <FieldLabel
                                  htmlFor={method.id}
                                  className={`
                              rounded-xl border-2 w-full p-4 transition-all duration-200
                              ${
                                method.enabled
                                  ? `cursor-pointer ${
                                      selectedGroup === method.value
                                        ? "ring-2 ring-primary bg-primary/5 border-primary shadow-sm"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`
                                  : "cursor-not-allowed opacity-50 border-gray-200 bg-gray-50"
                              }
                            `}
                                >
                                  <Field orientation="horizontal">
                                    <RadioGroupItem
                                      value={method.value}
                                      id={method.id}
                                      disabled={!method.enabled}
                                    />
                                    <FieldContent>
                                      <FieldTitle className="text-xs md:text-sm">
                                        {method.title}
                                        {!method.enabled && method.disabledLabel && (
                                          <span className="ml-2 text-xs text-orange-600 font-normal">
                                            ({method.disabledLabel})
                                          </span>
                                        )}
                                      </FieldTitle>
                                      <FieldDescription className="text-xs">
                                        {method.description}
                                      </FieldDescription>
                                    </FieldContent>
                                    {method.logos && method.logos.length > 0 ? (
                                      <span dir="ltr" className="flex max-w-[45%] shrink-0 flex-wrap items-center justify-end gap-1 self-center">
                                        {method.logos.map((logo) => (
                                          <Image
                                            key={logo.src}
                                            src={logo.src}
                                            alt={logo.alt}
                                            title={logo.alt}
                                            width={logo.card ? 36 : 24}
                                            height={24}
                                            className={logo.card ? "h-6 w-9 rounded-[3px] ring-1 ring-black/10" : "h-6 w-6 object-contain"}
                                          />
                                        ))}
                                      </span>
                                    ) : method.cash ? (
                                      <Banknote aria-hidden className="size-6 shrink-0 self-center text-emerald-700" />
                                    ) : null}
                                  </Field>
                                </FieldLabel>

                                {method.id === "online_manual" &&
                                  selectedGroup === "online_manual" && (
                                    <RadioGroup
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      className="ms-4 flex flex-col gap-2 border-s-2 border-primary/20 ps-3"
                                    >
                                      {manualMethods.map((child) => (
                                        <FieldLabel
                                          key={child.value}
                                          htmlFor={`payment-${child.value}`}
                                          className={`rounded-lg border-2 w-full p-3 cursor-pointer transition-all duration-200 ${
                                            field.value === child.value
                                              ? "ring-2 ring-primary bg-primary/5 border-primary shadow-sm"
                                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                          }`}
                                        >
                                          <Field orientation="horizontal">
                                            <RadioGroupItem
                                              value={child.value}
                                              id={`payment-${child.value}`}
                                            />
                                            <Image
                                              src={child.logo}
                                              alt={t(child.titleKey as any)}
                                              title={t(child.titleKey as any)}
                                              width={28}
                                              height={28}
                                              className="h-7 w-7 object-contain shrink-0"
                                            />
                                            <FieldContent>
                                              <FieldTitle className="text-xs md:text-sm">
                                                {t(child.titleKey as any)}
                                              </FieldTitle>
                                            </FieldContent>
                                          </Field>
                                        </FieldLabel>
                                      ))}
                                    </RadioGroup>
                                  )}

                                {method.id === "wallet" &&
                                  selectedGroup === "wallet" &&
                                  !isWalletEligible && (
                                    <RadioGroup
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      className="ms-4 flex flex-col gap-2 border-s-2 border-primary/20 ps-3"
                                    >
                                      {MANUAL_PAYMENT_METHODS.map((child) => {
                                        const childValue =
                                          toWalletPartialPaymentMethod(
                                            child.value,
                                          );
                                        return (
                                          <FieldLabel
                                            key={childValue}
                                            htmlFor={`payment-${childValue}`}
                                            className={`rounded-lg border-2 w-full p-3 cursor-pointer transition-all duration-200 ${
                                              field.value === childValue
                                                ? "ring-2 ring-primary bg-primary/5 border-primary shadow-sm"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                          >
                                            <Field orientation="horizontal">
                                              <RadioGroupItem
                                                value={childValue}
                                                id={`payment-${childValue}`}
                                              />
                                              <Image
                                                src={child.logo}
                                                alt={t(child.titleKey as any)}
                                                title={t(child.titleKey as any)}
                                                width={28}
                                                height={28}
                                                className="h-7 w-7 object-contain shrink-0"
                                              />
                                              <FieldContent>
                                                <FieldTitle className="text-xs md:text-sm">
                                                  {t(child.titleKey as any)}
                                                </FieldTitle>
                                              </FieldContent>
                                            </Field>
                                          </FieldLabel>
                                        );
                                      })}
                                    </RadioGroup>
                                  )}
                              </div>
                            ))}
                          </RadioGroup>
                        </FieldSet>
                      </FieldGroup>

                      {paymentGroups.length === 0 && (
                        <p className="text-xs md:text-sm text-orange-600">
                          {t("noPaymentMethodsAvailable")}
                        </p>
                      )}

                      {form.formState.errors.paymentMethod && (
                        <p className="text-xs md:text-sm text-red-500 mt-2">
                          {form.formState.errors.paymentMethod.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            {storeCheckoutForm && (
              <StoreCheckoutFields
                form={form}
                checkoutForm={storeCheckoutForm}
                answers={checkoutAnswers}
                onAnswersChange={(next) => {
                  setCheckoutAnswers(next);
                  setCheckoutAnswersError(null);
                }}
                error={checkoutAnswersError}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit order-2 lg:order-2">
            <OrderSummary
              items={cartLines}
              onQuantityChange={handleQuantityChange}
              busyItemId={busyItemId}
              summary={summary}
              showShipping
              enableCoupons
              isLoggedIn={isLoggedIn}
              shippingAddressId={shippingAddressId}
              isRecalculatingShipping={isRecalculatingShipping}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
              deposit={depositRows}
            >
              {shippingRefusal ? (
                <p role="alert" className="text-xs md:text-sm text-orange-600">
                  {shippingRefusal}
                </p>
              ) : isZoneShipping &&
                storeShipping?.daysMin != null &&
                storeShipping.daysMax != null ? (
                <p className="text-xs md:text-sm text-gray-600">
                  {t("arrivesIn", {
                    min: storeShipping.daysMin,
                    max: storeShipping.daysMax,
                  })}
                </p>
              ) : null}
              {minOrderMessage && (
                <p role="alert" className="text-xs md:text-sm text-orange-600">
                  <PriceText locale={locale}>{minOrderMessage}</PriceText>
                </p>
              )}
              {minOrderIssues.length > 0 && (
                <div role="alert" className="mb-2 space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs md:text-sm text-orange-800">
                  <p className="font-semibold">{t("minOrderQuantityTitle")}</p>
                  <ul className="space-y-2">
                    {minOrderIssues.map((issue) => (
                      <li key={issue.productId} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 flex-1">{t("minOrderQuantityErrorItem", { title: issue.title, minimum: issue.minimum, current: issue.current })}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={Boolean(busyItemId)}
                          onClick={() => void handleQuantityChange({ id: issue.lineId }, issue.lineQuantity + issue.missing)}
                        >
                          {t("minOrderQuantityFix", { missing: issue.missing })}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!shippingRefusal && noMethodInCurrency && (
                <p role="alert" className="text-xs md:text-sm text-orange-600">
                  {t("noPaymentInCurrency")}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full h-10 md:h-12 text-xs md:text-base font-semibold transition-all duration-200"
                disabled={isPending || !canPlaceOrder}
              >
                {isPending ? t("placingOrder") : t("placeOrder")}
              </Button>

              <Link href="/cart">
                <Button
                  variant="outline"
                  className="w-full h-9 md:h-11 text-xs md:text-sm border-2 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  {t("backToCart")}
                </Button>
              </Link>
            </OrderSummary>
          </div>
        </div>
      </form>
    </Form>
  );
};
