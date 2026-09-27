"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { FieldValues, Resolver } from "react-hook-form";

/**
 * Schemas carry message keys from the "validation" namespace (e.g.
 * "product.categoryRequired") instead of English text. This wraps a resolver
 * so every error message that is a known key is shown translated; anything
 * else (zod's own, already-localized messages) passes through unchanged.
 */
export function useLocalizedResolver<T extends FieldValues>(
  resolver: Resolver<T>
): Resolver<T> {
  const t = useTranslations("validation");

  return useMemo(() => {
    const translate = (message: string) =>
      t.has(message) ? t(message) : message;

    const walk = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      for (const [key, value] of Object.entries(node)) {
        if (key === "ref") continue;
        if (key === "message" && typeof value === "string") {
          (node as Record<string, unknown>).message = translate(value);
        } else {
          walk(value);
        }
      }
    };

    return async (...args) => {
      const result = await resolver(...args);
      walk(result.errors);
      return result;
    };
  }, [resolver, t]);
}

/** Same translation for messages read outside react-hook-form (safeParse). */
export function useValidationMessage() {
  const t = useTranslations("validation");
  return (message: string) => (t.has(message) ? t(message) : message);
}
