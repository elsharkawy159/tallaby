"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@workspace/ui/lib/utils";

interface PopoverProps
  extends React.ComponentProps<typeof PopoverPrimitive.Root> {
  triggerMode?: "click" | "hover";
}

const PopoverContext = React.createContext<{
  triggerMode: "click" | "hover";
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
} | null>(null);

function Popover({ triggerMode = "click", ...props }: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = React.useCallback(() => {
    if (triggerMode === "hover") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setOpen(true);
    }
  }, [triggerMode]);

  const handleMouseLeave = React.useCallback(() => {
    if (triggerMode === "hover") {
      timeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 150); // Small delay to prevent flickering
    }
  }, [triggerMode]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (triggerMode === "hover") {
    return (
      <PopoverContext.Provider
        value={{ triggerMode, handleMouseEnter, handleMouseLeave }}
      >
        <PopoverPrimitive.Root
          data-slot="popover"
          open={open}
          onOpenChange={setOpen}
          {...props}
        >
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="inline-block"
          >
            {props.children}
          </div>
        </PopoverPrimitive.Root>
      </PopoverContext.Provider>
    );
  }

  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const context = React.useContext(PopoverContext);

  const handleMouseEnter = React.useCallback(() => {
    if (context?.triggerMode === "hover") {
      context.handleMouseEnter();
    }
  }, [context]);

  const handleMouseLeave = React.useCallback(() => {
    if (context?.triggerMode === "hover") {
      context.handleMouseLeave();
    }
  }, [context]);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
