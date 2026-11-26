import type { EmailLocale } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import { Block, Cta, emailFrame, EmailShell, H1, isolateLtr, Lead, Pill, SectionTitle, SellerHelpLine, Text } from "./kit/components.js";

/*
 * "Your store is offline, top up" (ROADMAP.md F-113, owner 2026-11-26). Sent
 * once per seller, ever, when the trial days end without a top-up and every
 * store goes offline (docs/seller-top-up-rules.md §4). Arabic is what goes out;
 * English exists for the preview. Fees and amounts come from code as props.
 */

const copy = {
  ar: {
    subject: "متجرك متوقف الآن. اشحن محفظتك لتشغيله",
    pill: "المتجر متوقف",
    heading: "متجرك متوقف الآن",
    leadOne: (store: string) =>
      `انتهت الأيام المجانية دون شحن المحفظة، لذلك توقف متجر ${store}. يرى الزوار أن المتجر غير متاح، ولا يمكنهم إرسال طلبات جديدة.`,
    leadMany: "انتهت الأيام المجانية دون شحن المحفظة، لذلك توقفت كل متاجرك. يرى الزوار أن المتجر غير متاح، ولا يمكنهم إرسال طلبات جديدة.",
    back: "اشحن محفظتك الآن، وتعود متاجرك للعمل فورًا.",
    cta: "اشحن محفظتك",
    howTitle: "كيف تعمل المحفظة",
    feeOnDelivery: (fee: string) => `تدفع حسب طلباتك: في الباقة المجانية يخصم طلبي ${fee} من محفظتك عند توصيل كل طلب.`,
    feePerOrder: (fee: string) => `تدفع حسب طلباتك: في الباقة المجانية يخصم طلبي ${fee} من محفظتك عن كل طلب جديد.`,
    methods: (min: string) =>
      `يبدأ الشحن من ${min}. ادفع ببطاقة أو ميزة أو محفظة إلكترونية عبر Kashier ويُضاف الرصيد فورًا، أو بتحويل InstaPay ويُضاف بعد المراجعة.`,
    direct: "قيمة الطلبات تصلك أنت مباشرة، ولا تُضاف للمحفظة.",
  },
  en: {
    subject: "Your store is offline. Top up to turn it back on",
    pill: "Store offline",
    heading: "Your store is offline",
    leadOne: (store: string) =>
      `Your free days ended without a wallet top-up, so ${store} is now offline. Visitors see that the store is unavailable and can't place new orders.`,
    leadMany: "Your free days ended without a wallet top-up, so all your stores are now offline. Visitors see that the store is unavailable and can't place new orders.",
    back: "Top up your wallet now and your stores come back online right away.",
    cta: "Top up your wallet",
    howTitle: "How the wallet works",
    feeOnDelivery: (fee: string) => `Pay as you go: on the Free plan, Tallaby takes ${fee} from your wallet when each order is delivered.`,
    feePerOrder: (fee: string) => `Pay as you go: on the Free plan, Tallaby takes ${fee} from your wallet for each new order.`,
    methods: (min: string) =>
      `Top up from ${min}. Pay by card, Meeza or e-wallet through Kashier and the balance is added at once, or by InstaPay transfer and it is added after review.`,
    direct: "Your customers pay you directly. Order amounts never go into the wallet.",
  },
};

export interface SellerStoreOfflineEmailProps {
  locale?: EmailLocale;
  /** The primary (else oldest) store's name. */
  storeName: string;
  /** Live stores of the seller; more than one says "all your stores". */
  storeCount: number;
  /** The dashboard wallet page (absolute). */
  walletUrl: string;
  /** The Free plan's per-order fee, formatted (e.g. "$0.03"). */
  orderFee: string;
  /** The smallest top-up, formatted (e.g. "$5"). */
  minTopUp: string;
  /** The `fee_on_delivery` switch: the fee is taken on delivery, not when the order is placed. */
  feeOnDelivery: boolean;
}

export function sellerStoreOfflineSubject(locale: EmailLocale = "ar") {
  return copy[locale].subject;
}

export function SellerStoreOfflineEmail({
  locale = "ar",
  storeName,
  storeCount,
  walletUrl,
  orderFee,
  minTopUp,
  feeOnDelivery,
}: SellerStoreOfflineEmailProps) {
  const f = emailFrame(PLATFORM_BRAND, locale);
  const t = copy[locale];
  const fee = isolateLtr(orderFee);
  const lead = storeCount > 1 ? t.leadMany : t.leadOne(storeName);

  return (
    <EmailShell f={f} audience="seller" title={t.subject} preview={lead} headerMeta={storeName} footer={<SellerHelpLine f={f} />}>
      <Block f={f} padding="36px 32px 8px">
        <Pill f={f} tone="warning">
          {t.pill}
        </Pill>
        <H1 f={f}>{t.heading}</H1>
        <Lead f={f}>{lead}</Lead>
        <Lead f={f}>{t.back}</Lead>
        <Cta f={f} href={walletUrl} label={t.cta} />
      </Block>
      <Block f={f} divider padding="0 32px 32px" last>
        <SectionTitle f={f}>{t.howTitle}</SectionTitle>
        <Text f={f} pad={10}>
          {feeOnDelivery ? t.feeOnDelivery(fee) : t.feePerOrder(fee)}
        </Text>
        <Text f={f} pad={8}>
          {t.methods(isolateLtr(minTopUp))}
        </Text>
        <Text f={f} pad={8}>
          {t.direct}
        </Text>
      </Block>
    </EmailShell>
  );
}
