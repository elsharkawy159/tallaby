import Image from "next/image";
import { BASE_URL } from "@/lib/constants";
import s from "../storefront.module.css";

/** Small fixed mark crediting the platform; links back to tallaby.com. */
export function ByTallabyBadge() {
  return (
    <a
      href={BASE_URL || "https://tallaby.com"}
      target="_blank"
      rel="noopener"
      lang="en"
      dir="ltr"
      className={s.byTallaby}
    >
      <Image src="/logo/logo.png" alt="" width={18} height={18} className="rounded-[5px]" />
      By Tallaby
    </a>
  );
}
