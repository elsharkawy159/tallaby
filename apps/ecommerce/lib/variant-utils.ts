/**
 * Formats a variant title from option fields
 * Example: option1="color: black", option2="size: small" => "color: black, size: small"
 */
export function formatVariantTitle(
  variant:
    | {
        option1?: string | null;
        option2?: string | null;
        option3?: string | null;
        title?: string | null;
      }
    | null
    | undefined
): string | null {
  if (!variant) return null;

  // If title exists, use it
  if (variant.title) {
    return variant.title;
  }

  // Otherwise, build from options
  const optionParts: string[] = [];
  if (variant.option1) optionParts.push(variant.option1);
  if (variant.option2) optionParts.push(variant.option2);
  if (variant.option3) optionParts.push(variant.option3);

  if (optionParts.length === 0) return null;

  return optionParts.join(", ");
}

/**
 * Formats variant options as a compact string for display
 * Example: option1="color: black", option2="size: small" => "Black / Small"
 */
export function formatVariantOptions(
  variant:
    | {
        option1?: string | null;
        option2?: string | null;
        option3?: string | null;
      }
    | null
    | undefined
): string | null {
  if (!variant) return null;

  const optionParts: string[] = [];

  // Extract values from "key: value" format
  if (variant.option1) {
    const parts = variant.option1.split(":");
    optionParts.push(parts.length > 1 ? parts[1]!.trim() : variant.option1);
  }
  if (variant.option2) {
    const parts = variant.option2.split(":");
    optionParts.push(parts.length > 1 ? parts[1]!.trim() : variant.option2);
  }
  if (variant.option3) {
    const parts = variant.option3.split(":");
    optionParts.push(parts.length > 1 ? parts[1]!.trim() : variant.option3);
  }

  if (optionParts.length === 0) return null;

  return optionParts.join(" / ");
}
