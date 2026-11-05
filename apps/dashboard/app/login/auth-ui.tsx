/** Shared look for the auth pages (/login and /signup): `Seller Sign In v3`. Buttons are SellerButton with these sizes. */

export const PRIMARY_BUTTON = "h-[52px] w-full text-[15px] [&_svg]:size-[18px]";

export const OUTLINE_BUTTON = "h-[50px] w-full text-[15px] [&_svg]:size-[18px]";

/** The Google button: a field-shaped box, not a pill. */
export const GOOGLE_BUTTON =
  "h-[50px] w-full gap-2.5 rounded-[14px] border-(--s-field) text-[15px] font-semibold text-(--s-text) hover:border-(--s-outline) hover:shadow-(--s-shadow-hover)";

/** The bordered box around an auth input (`.in`). Goes red when the input inside it is invalid. */
export const AUTH_INPUT_BOX =
  "flex h-[50px] items-center overflow-hidden rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) transition-[border-color,box-shadow] duration-150 focus-within:border-(--s-primary) focus-within:shadow-[0_0_0_4px_var(--s-focus-soft)] has-aria-invalid:border-destructive has-aria-invalid:shadow-[0_0_0_4px_var(--destructive-soft)] has-disabled:opacity-60 max-[480px]:h-[52px]";

export const AUTH_LINK = "font-semibold text-(--s-link) hover:underline";

/** A line of text with a rule on each side. */
export const AUTH_DIVIDER =
  "flex items-center gap-3 text-[12.5px] text-(--s-faint) before:h-px before:flex-1 before:bg-(--s-field) after:h-px after:flex-1 after:bg-(--s-field)";

export function AuthHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  /** Step counter on signup. */
  eyebrow?: string;
  title: string;
  subtitle: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : undefined}>
      {eyebrow && <div className="mb-1 text-[12.5px] font-bold text-(--s-link)">{eyebrow}</div>}
      <h1 className="text-[clamp(26px,3.2vw,32px)] leading-[1.35] font-bold text-(--s-ink)">{title}</h1>
      <p className="mt-1 text-sm leading-[1.7] text-pretty text-(--s-muted)">{subtitle}</p>
    </div>
  );
}
