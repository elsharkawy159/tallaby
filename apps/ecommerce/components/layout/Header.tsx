import { cn } from "@/lib/utils";
import type { HeaderProps } from "./header.types";
import { ScrollingHeader } from "./header.client";
import { BottomNavigation } from "./bottom-navigation";
import { Logo } from "../logo";
import { LanguageSwitcher } from "./language-switcher";
import { SearchBar } from "./search-bar";
import { BecomeSellerButton } from "./header.chunks";
import { HeaderUserActions } from "./header-user-actions.client";

const MainHeader = () => {
  return (
    <div className={cn("bg-primary shadow-xs h-full w-full")}>
      <div className="py-2.5 container">
        {/* Mobile top section */}
        <div className="flex items-center md:hidden justify-between">
          <Logo />
          <LanguageSwitcher />
          <BecomeSellerButton />
        </div>

        <div className="md:mt-0 mt-3 md:hidden">
          <SearchBar variant="mobile" className="w-full" />
        </div>

        {/* Desktop layout */}
        <div
          className={cn(
            "hidden md:flex items-center justify-between gap-4 lg:gap-5 md:mt-0 mt-4"
          )}
        >
          <div className="flex items-center gap-8">
            <Logo />
            <LanguageSwitcher />
          </div>

          <SearchBar variant="desktop" />

          <HeaderUserActions />
        </div>
      </div>
    </div>
  );
};

const Header = ({ className }: HeaderProps) => {
  return (
    <>
      <ScrollingHeader className={className}>
        <MainHeader />
      </ScrollingHeader>

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </>
  );
};

export default Header;
