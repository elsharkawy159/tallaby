import type { SellerAudience } from "@workspace/lib/admin";

/**
 * Ready messages for Admin → seller notifications (owner request 2026-11-15).
 * Picking one fills the form; the admin can still edit it. Each has Arabic and
 * English text, because a message is sent exactly as written (one language per
 * send; sellers mostly read Arabic). No code-owned numbers (fees, grace days)
 * are written here, so nothing can drift from the product.
 *
 * Links are seller-level dashboard paths: `/welcome` opens the setup page of
 * the store selected in the seller's sidebar, and its `#hash` opens that step
 * (welcomeArrival in the dashboard's welcome.lib.ts; `#payments` goes on to the
 * store's Settings › Payments, `#share` to the "store is live" card); `/wallet?topup=1`
 * opens the top-up dialog. Keep bodies under about 180 characters, the push
 * alert's length (clipPushText).
 */

export type SellerMessageLanguage = "ar" | "en";

export type SellerNotificationTemplate = {
  id: string;
  /** Admin-facing name of the topic. */
  topic: string;
  /** The audience this template is usually sent to; only preselected in the group form. */
  audience: SellerAudience;
  link: string | null;
  text: Record<SellerMessageLanguage, { title: string; body: string }>;
};

export const SELLER_NOTIFICATION_TEMPLATES: readonly SellerNotificationTemplate[] = [
  {
    id: "top_up",
    topic: "Top up your wallet",
    audience: "wallet_empty",
    link: "/wallet?topup=1",
    text: {
      ar: {
        title: "يرجى شحن محفظة طلبي",
        body: "تُدفع رسوم الطلبات والتطبيقات من محفظة طلبي. يرجى شحنها الآن ليعمل متجرك دون انقطاع. يبقى رصيدك في محفظتك ولا تنتهي صلاحيته.",
      },
      en: {
        title: "Please top up your Tallaby wallet",
        body: "Order and app fees are paid from your Tallaby wallet. Please top it up now so your store keeps working without a break. Your balance stays in your wallet and doesn't expire.",
      },
    },
  },
  {
    id: "first_product",
    topic: "Add your first product",
    audience: "all",
    link: "/welcome#product",
    text: {
      ar: {
        title: "أضف أول منتج إلى متجرك",
        body: "متجرك جاهز لاستقبال المنتجات. أضف أول منتج بصوره وسعره ليبدأ عملاؤك الطلب.",
      },
      en: {
        title: "Add your first product",
        body: "Your store is ready for products. Add your first one with its photos and price so customers can start ordering.",
      },
    },
  },
  {
    id: "choose_theme",
    topic: "Choose a theme",
    audience: "all",
    link: "/welcome#theme",
    text: {
      ar: {
        title: "اختر تصميمًا لمتجرك",
        body: "اختر من قوالب طلبي الجاهزة تصميمًا يناسب نشاطك، ويمكنك تعديل ألوانه وصوره متى شئت.",
      },
      en: {
        title: "Choose a design for your store",
        body: "Pick a ready-made Tallaby template that suits your business. You can change its colors and photos at any time.",
      },
    },
  },
  {
    id: "shipping",
    topic: "Set up shipping",
    audience: "all",
    link: "/welcome#shipping",
    text: {
      ar: {
        title: "حدد أسعار الشحن",
        body: "حدد المناطق التي تشحن إليها وسعر الشحن لكل منها، ليعرف العميل التكلفة قبل الطلب.",
      },
      en: {
        title: "Set your shipping prices",
        body: "Choose the areas you ship to and the price for each, so customers see the cost before they order.",
      },
    },
  },
  {
    id: "payments",
    topic: "Set up payments",
    audience: "all",
    link: "/welcome#payments",
    text: {
      ar: {
        title: "اختر طرق الدفع",
        body: "فعّل طرق الدفع التي تناسبك، مثل الدفع عند الاستلام أو InstaPay. تصل المدفوعات إليك مباشرة.",
      },
      en: {
        title: "Choose your payment methods",
        body: "Turn on the payment methods that suit you, such as cash on delivery or InstaPay. Payments go straight to you.",
      },
    },
  },
  {
    id: "share_store",
    topic: "Share your store",
    audience: "all",
    link: "/welcome#share",
    text: {
      ar: {
        title: "شارك رابط متجرك",
        body: "انشر رابط متجرك على صفحاتك في مواقع التواصل وفي محادثات WhatsApp ليصل إليك العملاء.",
      },
      en: {
        title: "Share your store link",
        body: "Post your store link on your social pages and in WhatsApp chats so customers can find you.",
      },
    },
  },
  {
    id: "finish_setup",
    topic: "Finish your store setup",
    audience: "all",
    link: "/welcome",
    text: {
      ar: {
        title: "أكمل إعداد متجرك",
        body: "بقيت خطوات قليلة ليصبح متجرك جاهزًا للبيع. أكملها الآن من صفحة إعداد المتجر.",
      },
      en: {
        title: "Finish setting up your store",
        body: "A few steps are left before your store is ready to sell. Finish them now from your store setup page.",
      },
    },
  },
];

export function findSellerNotificationTemplate(id: string | null | undefined): SellerNotificationTemplate | null {
  return SELLER_NOTIFICATION_TEMPLATES.find((template) => template.id === id) ?? null;
}

/** The form fields a template fills, in one language. Null for an unknown id. */
export function templateFields(
  id: string | null | undefined,
  language: SellerMessageLanguage,
): { title: string; body: string; link: string } | null {
  const template = findSellerNotificationTemplate(id);
  if (!template) return null;
  return { ...template.text[language], link: template.link ?? "" };
}

/** Admin-facing audience names and what each one means. */
export const SELLER_AUDIENCE_LABELS: Record<SellerAudience, { label: string; hint: string }> = {
  all: { label: "All sellers", hint: "Every seller who isn't suspended." },
  wallet_empty: {
    label: "Wallet balance 0 or below",
    hint: "Sellers whose store wallet balance is 0 or below, as their Wallet page shows it (no wallet yet counts as 0).",
  },
  not_activated: {
    label: "Not activated yet",
    hint: "Never topped up, never had a balance above 0 and not on Pro. Empty before the USD switch.",
  },
};
