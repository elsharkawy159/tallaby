'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  ChevronRight,
  CreditCard,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { logout } from '@/actions/auth'
import type { AdminUser } from '@/lib/auth/middleware-types'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
}

const NAV_ITEMS = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/financial', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

function getInitials(name?: string, email?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return 'AD'
}

export function UserNav({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const displayName = user.fullName?.trim() || user.email?.split('@')[0] || 'Admin'
  const email = user.email || ''
  const roleLabel = ROLE_LABELS[user.role] || user.role
  const initials = getInitials(user.fullName, user.email)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setOpen(false)
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open account menu"
          className={cn(
            'relative size-10 rounded-full p-0',
            'ring-offset-background transition-shadow',
            'hover:ring-2 hover:ring-border hover:ring-offset-2',
            open && 'ring-2 ring-primary/30 ring-offset-2',
          )}
        >
          <Avatar className="size-9">
            <AvatarImage src="" alt={`${displayName} avatar`} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 overflow-hidden rounded-xl p-0 shadow-lg"
      >
        <div className="relative overflow-hidden border-b border-border bg-muted/40 px-4 pb-4 pt-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
          />
          <div className="relative flex items-start gap-3">
            <Avatar className="size-11 border border-border shadow-sm">
              <AvatarImage src="" alt={`${displayName} avatar`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="space-y-0.5">
                <p className="truncate text-sm font-semibold leading-none tracking-tight">
                  {displayName}
                </p>
                {email ? (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
              </div>
              <Badge
                variant="secondary"
                className="h-5 rounded-md px-1.5 text-[10px] font-medium tracking-wide"
              >
                {roleLabel}
              </Badge>
            </div>
          </div>
        </div>

        <nav className="p-1.5" aria-label="Account">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm',
                'text-foreground transition-colors',
                'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground">
                <Icon className="size-3.5" />
              </span>
              <span className="flex-1 font-medium">{label}</span>
              <ChevronRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className={cn(
              'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm',
              'text-foreground transition-colors',
              'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground">
              <Bell className="size-3.5" />
            </span>
            <span className="flex-1 text-left font-medium">Notifications</span>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Soon
            </span>
          </button>
        </nav>

        <Separator />

        <div className="p-1.5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium',
              'text-destructive transition-colors',
              'hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-60',
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10">
              <LogOut className="size-3.5" />
            </span>
            {isLoggingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
