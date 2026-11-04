"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** File drop area (`.drop`). Click, keyboard or drag; `onFiles` gets what the seller chose. */
export function DropZone({
  title,
  hint,
  icon: Icon = UploadCloud,
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null) => {
    if (disabled || !list?.length) return;
    onFiles(multiple ? Array.from(list) : Array.from(list).slice(0, 1));
  };

  return (
    <label
      htmlFor={id}
      data-over={over || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[20px] border-[1.5px] border-dashed border-(--s-field-strong) bg-linear-[160deg,var(--s-tint),var(--s-surface)_70%] p-[26px] text-center text-[12.5px] text-(--s-subtle) transition-colors duration-150 hover:border-(--s-primary) has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-(--s-focus) data-over:border-(--s-primary) data-over:bg-(--s-tint)",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <Icon aria-hidden className="size-[26px] text-(--s-primary)" />
      <b className="text-sm font-bold text-(--s-ink)">{title}</b>
      {hint}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files);
          // Choosing the same file again should fire again.
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </label>
  );
}
