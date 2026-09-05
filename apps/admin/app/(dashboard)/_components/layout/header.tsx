'use client'

import { usePathname } from 'next/navigation'
import { UserNav } from './user-nav'
import { getPageTitleFromPathname } from './header.lib'

export default function Header() {
  const pathname = usePathname()
  const pageTitle = getPageTitleFromPathname(pathname)

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 gap-4">
        <h1 className="text-xl font-semibold tracking-tight truncate">
          {pageTitle}
        </h1>
        <UserNav />
      </div>
    </header>
  )
}
