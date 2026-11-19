import type { ReactNode } from "react";

/** Tags used inside translated strings (`t.rich(key, richTags)`). */
export const richTags = {
  em: (chunks: ReactNode) => <em className="text-amber-600 not-italic">{chunks}</em>,
  u: (chunks: ReactNode) => <span className="whitespace-nowrap text-amber-600">{chunks}</span>,
  br: () => <br />,
};
