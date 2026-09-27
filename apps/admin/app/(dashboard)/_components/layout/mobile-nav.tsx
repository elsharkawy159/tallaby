"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

type MobileNavState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavState | null>(null);

/** Shares the mobile sidebar drawer state between the header and sidebar. */
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer once a link navigates away.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error("useMobileNav must be used inside MobileNavProvider");
  }
  return context;
}

export function MobileNavTrigger() {
  const { setOpen } = useMobileNav();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 lg:hidden"
      onClick={() => setOpen(true)}
    >
      <Menu className="size-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  );
}
