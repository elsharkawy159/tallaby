// Where the floating WhatsApp support button sits, and how much room pages
// leave for it. Pages with a fixed bottom action bar (save / publish / pay)
// lift the button above the bar, since in RTL the primary action sits in the
// same bottom-left corner.

const PRODUCT_FORM_PATH = /^\/products\/(add|[^/]+\/edit)(\/|$)/;
const MARKETING_PATH = /^\/marketing(\/|$)/;
const WALLET_PATH = /^\/wallet\/?$/;

export const fabOffsetFor = (pathname: string) => {
  // Add product (incl. bulk import) and edit product: the bar shows on every
  // breakpoint. On phones it wraps to full-width buttons, so the button hides.
  if (PRODUCT_FORM_PATH.test(pathname)) return "bottom-24 max-sm:hidden";
  // Advertise products: the summary bar shows below lg only.
  if (MARKETING_PATH.test(pathname)) return "bottom-24 lg:bottom-5";
  // Store wallet: the top-up bar shows below lg only (the page keeps pb-24 for it).
  if (WALLET_PATH.test(pathname)) return "bottom-24 lg:bottom-5";
  return "bottom-5";
};

/**
 * Bottom padding that keeps the end of every page clear of the button
 * (bottom-5 + size-14 = 76px, plus a gap). Pages with a fixed bottom bar
 * already pad for it.
 */
export const fabClearanceFor = (pathname: string) => {
  if (PRODUCT_FORM_PATH.test(pathname)) return "";
  // The marketing page pads below lg for its summary bar; from lg the bar is gone.
  if (MARKETING_PATH.test(pathname)) return "lg:pb-24";
  return "pb-24";
};
