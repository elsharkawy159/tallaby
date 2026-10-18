import { getSocialPlatform } from "./platforms";

/** A platform's brand icon (24×24, `currentColor`); nothing for an unknown platform. */
export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const icon = getSocialPlatform(platform)?.icon;
  if (!icon) return null;
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" focusable="false">
      <path d={icon} fill="currentColor" />
    </svg>
  );
}
