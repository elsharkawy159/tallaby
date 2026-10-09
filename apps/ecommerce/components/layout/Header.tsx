import { cn } from "@/lib/utils";
import type { HeaderProps } from "./header.types";
import { ScrollingHeader } from "./header.client";
import { BottomNavigation } from "./bottom-navigation";
import { Logo } from "../logo";
import { LanguageSwitcher } from "./language-switcher";
import { SearchBar } from "./search-bar";
import { BecomeSellerButton } from "./header.chunks";
import { HeaderUserActions } from "./header-user-actions.client";
import { TopBar } from "./top-bar";
// import { CategoryNav } from "./category-nav";

const MainHeader = () => {
  return (
    <div className={cn("bg-primary shadow-xs h-full w-full")}>
      <div className="py-2.5 md:py-0 container">
        {/* Mobile top section */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <Logo className="shrink-0" />
          <LanguageSwitcher />
          <BecomeSellerButton className="shrink-0 px-3 text-xs" />
        </div>

        <div className="md:mt-0 mt-3 md:hidden">
          <SearchBar variant="mobile" className="w-full" />
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex h-18 items-center gap-4 lg:gap-6">
          <Logo className="shrink-0" logoClassName="md:h-8" />
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
      <TopBar />
      {/* <ScrollingHeader className={className}> */}
        <MainHeader />
        {/* <CategoryNav /> */}
      {/* </ScrollingHeader> */}

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </>
  );
};

export default Header;
