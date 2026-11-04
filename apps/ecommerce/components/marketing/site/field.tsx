import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

const inputBase =
  "w-full rounded-[14px] border-[1.5px] border-line-strong bg-white px-3.5 text-[15px] outline-0 transition-[border-color,box-shadow] duration-150 focus:border-teal-700 focus:shadow-[var(--ring-focus)]";

/** For inputs built by another component (a select, a phone field). */
export const fieldInputClassName = cn(inputBase, "h-[50px]");

/** A label above its control. */
export function Field({ label, htmlFor, className, children }: { label: React.ReactNode; htmlFor?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldInputClassName, className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(inputBase, "min-h-[130px] resize-y py-3 leading-[1.6]", className)} {...props} />;
}
