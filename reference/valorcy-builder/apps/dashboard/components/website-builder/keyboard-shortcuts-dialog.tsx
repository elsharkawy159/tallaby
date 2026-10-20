"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Shortcut {
  keys: string[]
  label: string
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

const mod = isMac ? "⌘" : "Ctrl"

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const t = useTranslations('dialogs.keyboardShortcuts')

  const SHORTCUT_GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
    {
      title: t('historyGroup'),
      shortcuts: [
        { keys: [mod, "Z"], label: t('undo') },
        { keys: [mod, "⇧", "Z"], label: t('redo') },
      ],
    },
    {
      title: t('editingGroup'),
      shortcuts: [
        { keys: [mod, "K"], label: t('quickInsert') },
        { keys: [mod, "D"], label: t('duplicateSelection') },
        { keys: [mod, "C"], label: t('copySelection') },
        { keys: [mod, "X"], label: t('cutSelection') },
        { keys: [mod, "V"], label: t('paste') },
        { keys: [mod, "G"], label: t('groupSelection') },
        { keys: ["Del"], label: t('deleteSelection') },
      ],
    },
    {
      title: t('navigationGroup'),
      shortcuts: [
        { keys: ["↑", "↓"], label: t('navigateSiblings') },
        { keys: ["←", "→"], label: t('navigateParentChild') },
        { keys: ["Tab"], label: t('navigateTree') },
      ],
    },
    {
      title: t('generalGroup'),
      shortcuts: [
        { keys: [mod, "S"], label: t('saveNow') },
        { keys: ["Esc"], label: t('deselect') },
        { keys: ["?"], label: t('showHelp') },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {group.shortcuts.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-foreground">{s.label}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
