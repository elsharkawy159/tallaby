/**
 * Every manifest, in App Center order (by category, then the order sellers
 * most often need them). A new app: one file here + its line below.
 */
import aiAssistants from "./ai-assistants";
import aramex from "./aramex";
import bosta from "./bosta";
import customerNotifications from "./customer-notifications";
import googleAnalytics from "./google-analytics";
import googleSheets from "./google-sheets";
import googleTagManager from "./google-tag-manager";
import jtExpress from "./jt-express";
import kashier from "./kashier";
import metaCapi from "./meta-capi";
import metaPixel from "./meta-pixel";
import moyasar from "./moyasar";
import mylerz from "./mylerz";
import paylink from "./paylink";
import paymob from "./paymob";
import paypal from "./paypal";
import paytabs from "./paytabs";
import productFeeds from "./product-feeds";
import shopifyImport from "./shopify-import";
import sizeChart from "./size-chart";
import sms from "./sms";
import snapchatPixel from "./snapchat-pixel";
import tabby from "./tabby";
import tallabyPay from "./tallaby-pay";
import tiktokPixel from "./tiktok-pixel";
import wassalha from "./wassalha";

export const MANIFESTS = [
  aiAssistants,
  sizeChart,
  metaPixel,
  googleAnalytics,
  googleTagManager,
  metaCapi,
  tiktokPixel,
  snapchatPixel,
  productFeeds,
  bosta,
  wassalha,
  mylerz,
  jtExpress,
  aramex,
  paymob,
  kashier,
  paytabs,
  moyasar,
  paylink,
  tabby,
  paypal,
  tallabyPay,
  googleSheets,
  shopifyImport,
  customerNotifications,
  sms,
] as const;
