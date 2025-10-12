import Link from "next/link";
import { LogoProps } from "./layout/header.types";

export const Logo = ({ className }: LogoProps) => {
    return (
      <Link href="/" className={className}>
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
          <span className="text-accent">t</span>allaby
        </span>
      </Link>
    );
  };