"use client";

import { useId } from "react";
import { VisibilitySection } from "../sections/visibility-section";
import type { SupportedLocale } from "../add-product.schema";

interface SeoStepProps {
  activeLocale: SupportedLocale;
}

/** Merchandising flags and search listing — used by the edit wizard and bulk import. */
export function SeoStep({ activeLocale }: SeoStepProps) {
  const uid = useId();
  return <VisibilitySection id={`${uid}-visibility`} activeLocale={activeLocale} />;
}
