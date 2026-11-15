/**
 * The side drawer's look (the design's `.drw`): flush to the inline end, a bottom
 * sheet at 600px and below, with a 40px close button. Pass to SheetContent.
 */
export const APP_DRAWER_CLASS =
  "flex w-full flex-col gap-0 border-(--s-line) bg-(--s-surface) p-0 text-(--s-body) sm:max-w-[460px] max-[600px]:inset-x-0 max-[600px]:top-auto max-[600px]:bottom-0 max-[600px]:h-auto max-[600px]:max-h-[90dvh] max-[600px]:w-full max-[600px]:rounded-t-[24px] max-[600px]:border-0 [&>button]:end-2.5 [&>button]:top-2.5 [&>button]:grid [&>button]:size-10 [&>button]:place-items-center [&>button]:rounded-[11px]";

/** The drawer's sticky footer: its buttons share the width. */
export const APP_DRAWER_FOOTER_CLASS = "flex-row flex-wrap gap-2 border-t border-(--s-line-soft) px-[18px] py-3.5 [&>*]:flex-1";
