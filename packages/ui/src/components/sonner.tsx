"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

// One toast look in every app and theme: a dark pill at the bottom centre,
// white text, no close button (Claude Design, Seller Products).
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      offset={24}
      // Above the iPhone home indicator; env() is 0 where there is no inset.
      mobileOffset={{ top: 16, right: 16, left: 16, bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      gap={8}
      // Sonner's phone CSS (≤600px) sets the list to left/right 16px AND width 100%,
      // so it is a viewport wider than the room left: in RTL it hangs 16px off the
      // left edge, in LTR off the right, and the centred toast sits 16px off-centre.
      // Width auto lets left/right size it, so toasts centre in both directions.
      className="max-[600px]:!w-auto"
      style={
        {
          "--normal-bg": "#1f2a2e",
          "--normal-text": "#ffffff",
          "--normal-border": "transparent",
          "--border-radius": "12px",
          fontFamily: "inherit",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!w-fit !max-w-[calc(100vw-2rem)] !mx-auto !left-0 !right-0 !gap-2 !px-4 !py-2.5 !text-[13px] !shadow-lg",
          title: "!font-medium",
          description: "!text-white/70",
          icon: "!size-4 [&>svg]:!size-4",
          success: "[&_[data-icon]]:!text-[#4ade80]",
          error: "[&_[data-icon]]:!text-[#f87171]",
          warning: "[&_[data-icon]]:!text-[#fdad28]",
          info: "[&_[data-icon]]:!text-white",
          actionButton: "!bg-white !text-[#1f2a2e] !rounded-lg",
          cancelButton: "!bg-white/15 !text-white !rounded-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
