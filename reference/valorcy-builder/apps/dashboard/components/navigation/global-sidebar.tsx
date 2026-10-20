'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { globalNavItems } from '@/lib/data'
import { Badge } from '@workspace/ui/components/badge'
import {
  ClipboardList,
  LayoutDashboard,
  FolderKanban,
  Layout,
  Receipt,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import {
  SidebarFooter,
  SidebarShell,
  type SidebarProject,
} from '@/components/navigation/sidebar-shared'

const iconMap: Record<string, LucideIcon> = {
  ClipboardList,
  LayoutDashboard,
  FolderKanban,
  Layout,
  Receipt,
  Settings,
}

function isGlobalNavActive (pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  if (href === '/projects') {
    return pathname === '/projects' || pathname === '/projects/new'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function GlobalSidebar ({
  activeNav,
  onSignOut,
  projects,
  selectedProjectId,
  isCollapsed = false,
  onToggleCollapse,
  currentPathname,
}: {
  activeNav: string
  onSignOut: () => void
  projects: SidebarProject[]
  selectedProjectId: string | null
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  currentPathname?: string | null
}) {
  const t = useTranslations('pages.dashboard')
  const tNav = useTranslations('data.dashboardNav')
  const compact = Boolean(isCollapsed && onToggleCollapse)

  return (
    <SidebarShell
      compact={compact}
      onToggleCollapse={onToggleCollapse}
      footer={
        <SidebarFooter
          projects={projects}
          selectedProjectId={selectedProjectId}
          compact={compact}
          onSignOut={onSignOut}
          currentPathname={currentPathname}
        />
      }
    >
      <nav className="space-y-1">
        {globalNavItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard
          const isActive = isGlobalNavActive(activeNav, item.href)
          const isDisabled = item.active === false || item.soon === true
          const label = tNav(item.key)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-disabled={isDisabled}
              onClick={(e) => {
                if (!isDisabled) return
                e.preventDefault()
              }}
              title={compact ? label : undefined}
              className={cn(
                'flex w-full items-center rounded-lg text-sm font-medium transition-all duration-200',
                compact ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                isDisabled && 'pointer-events-none opacity-60'
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!compact && <span>{label}</span>}
              {!compact && item.soon && (
                <Badge
                  variant="secondary"
                  className="ms-auto h-5 px-2 py-0 text-[10px]"
                >
                  {t('soon')}
                </Badge>
              )}
              {!compact && !item.soon && isActive && (
                <div className="ms-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>
    </SidebarShell>
  )
}
