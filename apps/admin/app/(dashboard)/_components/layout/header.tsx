'use client'

import { usePathname } from 'next/navigation'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { UserNav } from './user-nav'
import { getPageTitleFromPathname } from './header.lib'
import type { AdminUser } from '@/lib/auth/middleware-types'

export default function Header({ user }: { user: AdminUser }) {
  const pathname = usePathname()
  const pageTitle = getPageTitleFromPathname(pathname)

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 gap-4">
        <h1 className="text-xl font-semibold tracking-tight truncate">
          {pageTitle}
        </h1>
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}
