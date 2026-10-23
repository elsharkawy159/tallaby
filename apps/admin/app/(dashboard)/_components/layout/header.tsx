'use client'

import { usePathname } from 'next/navigation'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { InstallAppButton } from '@/components/install-app-button'
import { UserNav } from './user-nav'
import { NotificationBell } from './notification-bell'
import { getPageTitleFromPathname } from './header.lib'
import { MobileNavTrigger } from './mobile-nav'
import type { AdminUser } from '@/lib/auth/middleware-types'

export default function Header({ user }: { user: AdminUser }) {
  const pathname = usePathname()
  const pageTitle = getPageTitleFromPathname(pathname)

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <MobileNavTrigger />
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            {pageTitle}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InstallAppButton />
          <ThemeSwitcher />
          <NotificationBell />
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}
