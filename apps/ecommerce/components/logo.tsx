import Link from "next/link";
import { LogoProps } from "./layout/header.types";
import { useLocale } from "next-intl";

export const Logo = ({ className }: LogoProps) => {
  const locale = useLocale();
    return (
      <Link href="/" className={className}>
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
          <span className="text-accent">{locale === "ar" ? "ط" : "t"}</span>
          {locale === "ar" ? "لبي" : "allaby"}
        </span>
      </Link>
    );
  };