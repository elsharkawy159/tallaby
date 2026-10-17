'use client'

import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'
import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import { X } from 'lucide-react'

import { LinkPicker, StyleSelect } from '@/components/website-builder/controls'
import { IconPicker } from '@/components/website-builder/icons/icon-picker'
import type { NavItem } from '@/lib/builder/shared-chrome/types'

type NavBadgeVariant = NonNullable<NavItem['badge']>['variant']

const ACTIVE_STATE_OPTIONS = [
  { value: 'auto', label: 'Automatic' },
  { value: 'always', label: 'Always active' },
  { value: 'never', label: 'Never active' },
]

const BADGE_VARIANTS = [
  { value: 'default', label: 'Default' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'destructive', label: 'Destructive' },
]

/**
 * Settings for one navigation item. Every change is a single `patch` call so the
 * caller can route it through `updateChrome` — one store write, one undo step.
 */
export function NavItemEditor ({
  item,
  onPatch,
  onClose,
}: {
  item: NavItem
  onPatch: (patch: Partial<NavItem>) => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-foreground">Link settings</p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-5"
          aria-label="Close link settings"
          onClick={onClose}
        >
          <X className="size-3" />
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`nav-label-${item.id}`} className="text-[10px]">
          Label
        </Label>
        <Input
          id={`nav-label-${item.id}`}
          value={item.label}
          className="h-7 text-xs"
          onChange={(e) => onPatch({ label: e.target.value })}
        />
      </div>

      <LinkPicker
        id={`nav-link-${item.id}`}
        label="Link"
        value={item.link}
        onChange={(link) => onPatch({ link })}
      />

      <Separator />

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`nav-newtab-${item.id}`} className="text-[10px]">
          Open in new tab
        </Label>
        <Switch
          id={`nav-newtab-${item.id}`}
          checked={Boolean(item.newTab)}
          onCheckedChange={(newTab) => onPatch({ newTab })}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`nav-hidden-${item.id}`} className="text-[10px]">
          Hidden
        </Label>
        <Switch
          id={`nav-hidden-${item.id}`}
          checked={Boolean(item.hidden)}
          onCheckedChange={(hidden) => onPatch({ hidden })}
        />
      </div>

      <StyleSelect
        id={`nav-active-${item.id}`}
        label="Active state"
        value={item.activeState ?? 'auto'}
        onValueChange={(v) => onPatch({ activeState: v as NavItem['activeState'] })}
        options={ACTIVE_STATE_OPTIONS}
        allowEmpty={false}
      />

      <div className="flex flex-col gap-1">
        <Label className="text-[10px]">Icon</Label>
        <IconPicker value={item.icon ?? ''} onChange={(icon) => onPatch({ icon })} />
        {item.icon ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 self-start px-1 text-[10px] text-muted-foreground"
            onClick={() => onPatch({ icon: undefined })}
          >
            Remove icon
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`nav-badge-${item.id}`} className="text-[10px]">
          Badge
        </Label>
        <Input
          id={`nav-badge-${item.id}`}
          value={item.badge?.text ?? ''}
          placeholder="e.g. New"
          className="h-7 text-xs"
          onChange={(e) =>
            onPatch({
              badge: e.target.value
                ? { text: e.target.value, variant: item.badge?.variant ?? 'primary' }
                : undefined,
            })
          }
        />
      </div>

      {item.badge?.text ? (
        <StyleSelect
          label="Badge style"
          value={item.badge.variant ?? 'primary'}
          onValueChange={(variant) =>
            onPatch({ badge: { text: item.badge!.text, variant: variant as NavBadgeVariant } })
          }
          options={BADGE_VARIANTS}
          allowEmpty={false}
        />
      ) : null}

      <Separator />

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`nav-divider-before-${item.id}`} className="text-[10px]">
          Divider before
        </Label>
        <Switch
          id={`nav-divider-before-${item.id}`}
          checked={Boolean(item.dividerBefore)}
          onCheckedChange={(dividerBefore) => onPatch({ dividerBefore })}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`nav-divider-after-${item.id}`} className="text-[10px]">
          Divider after
        </Label>
        <Switch
          id={`nav-divider-after-${item.id}`}
          checked={Boolean(item.dividerAfter)}
          onCheckedChange={(dividerAfter) => onPatch({ dividerAfter })}
        />
      </div>
    </div>
  )
}
