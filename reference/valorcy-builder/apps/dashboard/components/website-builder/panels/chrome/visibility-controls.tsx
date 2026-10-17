'use client'

import { Laptop, Smartphone, Tablet } from 'lucide-react'

import { Label } from '@workspace/ui/components/label'
import { Toggle } from '@workspace/ui/components/toggle'
import { cn } from '@workspace/ui/lib/utils'

import { StyleSelect } from '@/components/website-builder/controls'
import type { VisibilityRules } from '@/lib/builder/shared-chrome/types'

const AUTH_OPTIONS = [
  { value: 'always', label: 'Everyone' },
  { value: 'loggedOut', label: 'Signed-out visitors' },
  { value: 'loggedIn', label: 'Signed-in visitors' },
]

const BREAKPOINTS = [
  { key: 'showDesktop', label: 'Desktop', Icon: Laptop },
  { key: 'showTablet', label: 'Tablet', Icon: Tablet },
  { key: 'showMobile', label: 'Mobile', Icon: Smartphone },
] as const

/**
 * Responsive + auth-state visibility for one chrome component. Shared by every
 * component type, so the rules stay identical everywhere they're offered.
 */
export function VisibilityControls ({
  visibility,
  onChange,
}: {
  visibility: VisibilityRules
  onChange: (next: VisibilityRules) => void
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2.5">
      <Label className="text-[10px]">Visible on</Label>
      <div className="flex gap-1">
        {BREAKPOINTS.map(({ key, label, Icon }) => (
          <Toggle
            key={key}
            size="sm"
            aria-label={`Show on ${label}`}
            pressed={visibility[key]}
            onPressedChange={(pressed) => onChange({ ...visibility, [key]: pressed })}
            className={cn(
              'h-7 flex-1 gap-1 text-[10px]',
              !visibility[key] && 'text-muted-foreground'
            )}
          >
            <Icon className="size-3" />
            {label}
          </Toggle>
        ))}
      </div>

      <StyleSelect
        label="Show to"
        value={visibility.auth}
        onValueChange={(auth) =>
          onChange({ ...visibility, auth: auth as VisibilityRules['auth'] })
        }
        options={AUTH_OPTIONS}
        allowEmpty={false}
      />
    </div>
  )
}
