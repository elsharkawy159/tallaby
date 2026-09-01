import type { SimpleIcon } from "simple-icons"
import {
  siFacebook,
  siInstagram,
  siThreads,
  siTiktok,
  siX,
  siYoutube,
} from "simple-icons"
import { cn } from "@/lib/utils"
import { TALLABY_SOCIAL_LINKS } from "@/lib/social-links"

interface SimpleBrandIconProps {
  icon: SimpleIcon
  className?: string
}

function SimpleBrandIcon({ icon, className }: SimpleBrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d={icon.path} fill="currentColor" />
    </svg>
  )
}

type SocialBrandItem = {
  label: string
  href: string
  icon: SimpleIcon
  className: string
}

export const SOCIAL_BRAND_ITEMS: SocialBrandItem[] = [
  {
    label: "Facebook",
    href: TALLABY_SOCIAL_LINKS.facebook,
    icon: siFacebook,
    className: "bg-[#1877F2] text-white",
  },
  {
    label: "Instagram",
    href: TALLABY_SOCIAL_LINKS.instagram,
    icon: siInstagram,
    className:
      "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
  },
  {
    label: "X",
    href: TALLABY_SOCIAL_LINKS.x,
    icon: siX,
    className: "bg-black text-white",
  },
  {
    label: "Threads",
    href: TALLABY_SOCIAL_LINKS.threads,
    icon: siThreads,
    className: "bg-black text-white",
  },
  {
    label: "TikTok",
    href: TALLABY_SOCIAL_LINKS.tiktok,
    icon: siTiktok,
    className: "bg-black text-white",
  },
  {
    label: "YouTube",
    href: TALLABY_SOCIAL_LINKS.youtube,
    icon: siYoutube,
    className: "bg-[#FF0000] text-white",
  },
]

export function SocialBrandLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {SOCIAL_BRAND_ITEMS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          title={social.label}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110",
            social.className
          )}
          aria-label={social.label}
        >
          <SimpleBrandIcon icon={social.icon} className="h-5 w-5" />
        </a>
      ))}
    </div>
  )
}
