/**
 * Every manifest, in App Center order (by category, then the order sellers
 * most often need them). A new app: one file here + its line below.
 */
import aiAssistants from "./ai-assistants";
import coupons from "./coupons";
import automaticDiscounts from "./automatic-discounts";
import quantityOffers from "./quantity-offers";
import bundles from "./bundles";
import emailCampaigns from "./email-campaigns";
import catalogShare from "./catalog-share";
import orderProtection from "./order-protection";
import missedOrders from "./missed-orders";
import minOrder from "./min-order";
import storeApp from "./store-app";
import languages from "./languages";
import shoppableGallery from "./shoppable-gallery";
import aramex from "./aramex";
import bosta from "./bosta";
import crossSell from "./cross-sell";
import customerNotifications from "./customer-notifications";
import downsell from "./downsell";
import easykash from "./easykash";
import googleAnalytics from "./google-analytics";
import googleSearchConsole from "./google-search-console";
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
import priceRounding from "./price-rounding";
import productFeeds from "./product-feeds";
import qrCodes from "./qr-codes";
import removeBranding from "./remove-branding";
import salesPopup from "./sales-popup";
import shopifyImport from "./shopify-import";
import sizeChart from "./size-chart";
import sms from "./sms";
import snapchatPixel from "./snapchat-pixel";
import tabby from "./tabby";
import tallabyPay from "./tallaby-pay";
import tiktokPixel from "./tiktok-pixel";
import topLoader from "./top-loader";
import wassalha from "./wassalha";
import whatsapp from "./whatsapp";
import whatsappButton from "./whatsapp-button";

export const MANIFESTS = [
  aiAssistants,
  sizeChart,
  qrCodes,
  removeBranding,
  storeApp,
  languages,
  shoppableGallery,
  topLoader,
  whatsappButton,
  // Marketing tools (owner, 2026-11-27).
  downsell,
  crossSell,
  salesPopup,
  priceRounding,
  coupons,
  automaticDiscounts,
  quantityOffers,
  bundles,
  emailCampaigns,
  catalogShare,
  // Orders (owner, 2026-11-27).
  orderProtection,
  missedOrders,
  minOrder,
  metaPixel,
  googleAnalytics,
  googleTagManager,
  metaCapi,
  tiktokPixel,
  snapchatPixel,
  productFeeds,
  googleSearchConsole,
  bosta,
  wassalha,
  mylerz,
  jtExpress,
  aramex,
  // Tallaby Pay first among the payment gateways (owner, 2026-11-18).
  tallabyPay,
  paymob,
  kashier,
  easykash,
  paytabs,
  moyasar,
  paylink,
  tabby,
  paypal,
  googleSheets,
  shopifyImport,
  customerNotifications,
  whatsapp,
  sms,
] as const;
