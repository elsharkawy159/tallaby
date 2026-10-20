/** Shared look for the auth pages (/login and /signup). */

export const PRIMARY_BUTTON =
  "h-[50px] w-full rounded-full bg-accent text-[15px] font-semibold text-[#171717] hover:bg-[#e89318]";

/** Box styling for auth-page inputs (AuthField and the signup store-address field). */
export const AUTH_INPUT_BOX = "h-12 rounded-[10px] bg-white text-[15px] md:text-[15px] dark:bg-card";

export const OUTLINE_BUTTON = "h-[50px] w-full rounded-full text-[15px] font-semibold";

export function AuthHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[12.5px] font-semibold tracking-[0.08em] text-[#2c6e80] uppercase rtl:tracking-normal">
        {eyebrow}
      </div>
      <h1 className="mt-1.5 mb-2 text-[26px] leading-tight font-bold tracking-[-0.01em] text-foreground rtl:tracking-normal lg:text-[32px]">
        {title}
      </h1>
      <p className="m-0 text-[15px] leading-relaxed text-pretty text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}
