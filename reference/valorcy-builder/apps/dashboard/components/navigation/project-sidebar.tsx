'use client'

import { useMemo } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { buildProjectNav, type ProjectNavItemView } from '@/lib/kits/nav'
import { projectPath } from '@/lib/project-routes'
import { Badge } from '@workspace/ui/components/badge'
import {
  LayoutDashboard,
  Hammer,
  Layers,
  BookText,
  Database,
  BarChart3,
  Globe2,
  Settings,
  ArrowLeft,
  // Kit nav icons
  ShoppingBag,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Boxes,
  BadgePercent,
  UtensilsCrossed,
  BookOpen,
  CalendarClock,
  Stethoscope,
  UserRound,
  HeartPulse,
  Dumbbell,
  ClipboardList,
  CreditCard,
  UserCircle,
  FolderKanban,
  Sparkles,
  Briefcase,
  Building2,
  Building,
  Home,
  Cloud,
  GraduationCap,
  Inbox,
  Bot,
  type LucideIcon,
} from 'lucide-react'
import {
  SidebarFooter,
  SidebarShell,
  type SidebarProject,
} from '@/components/navigation/sidebar-shared'
import { CmsSidebarSection } from '@/components/navigation/cms-sidebar-section'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Hammer,
  Layers,
  BookText,
  Database,
  BarChart3,
  Globe2,
  Settings,
  ShoppingBag,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Boxes,
  BadgePercent,
  UtensilsCrossed,
  BookOpen,
  CalendarClock,
  Stethoscope,
  UserRound,
  HeartPulse,
  Dumbbell,
  ClipboardList,
  CreditCard,
  UserCircle,
  FolderKanban,
  Sparkles,
  Briefcase,
  Building2,
  Building,
  Home,
  Cloud,
  GraduationCap,
  Inbox,
  Bot,
}

function isProjectNavActive (
  pathname: string,
  projectId: string,
  section: string,
): boolean {
  const base = projectPath(projectId)
  if (!section) {
    return pathname === base
  }
  const full = `${base}/${section}`
  if (section === 'settings' || section === 'cms') {
    return pathname === full || pathname.startsWith(`${full}/`)
  }
  return pathname === full || pathname.startsWith(`${full}/`)
}

export function ProjectSidebar ({
  projectId,
  activeNav,
  onSignOut,
  projects,
  selectedProjectId,
  isCollapsed = false,
  onToggleCollapse,
  currentPathname,
}: {
  projectId: string
  activeNav: string
  onSignOut: () => void
  projects: SidebarProject[]
  selectedProjectId: string | null
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  currentPathname?: string | null
}) {
  const t = useTranslations('pages.dashboard')
  const tNav = useTranslations('data.projectNav')
  const compact = Boolean(isCollapsed && onToggleCollapse)

  // The active project's Business Kit nav groups (resolved server-side in
  // dashboard-shell-wrapper.tsx, since kits are DB-backed/async now). The
  // sidebar lives above the project layout's context provider, so we read
  // from the `projects` prop rather than context.
  const kitNavGroups = useMemo(
    () => projects.find((p) => p.id === projectId)?.kitNavGroups ?? [],
    [projects, projectId],
  )
  const sections = useMemo(() => buildProjectNav(kitNavGroups), [kitNavGroups])

  function renderNavItem (item: ProjectNavItemView) {
    // CMS renders as an accordion (overview link + dynamic collection list).
    if (item.key === 'cms') {
      return (
        <CmsSidebarSection key={item.key} projectId={projectId} compact={compact} />
      )
    }

    const Icon = iconMap[item.icon] || LayoutDashboard
    const href = projectPath(projectId, item.href || undefined)
    const isActive = isProjectNavActive(activeNav, projectId, item.href)
    const isDisabled = item.soon === true
    const label = tNav(item.key)

    return (
      <Link
        key={item.key}
        href={href}
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
  }

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
      {!compact && (
        <Link
          href="/projects"
          className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          {t('backToProjects')}
        </Link>
      )}

      <nav className="space-y-1">
        {sections.map((section, i) => (
          <div key={section.headerKey ?? `section-${i}`} className="space-y-1">
            {!compact && section.headerKey && section.items.length > 0 && (
              <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {tNav(section.headerKey)}
              </p>
            )}
            {section.items.map(renderNavItem)}
          </div>
        ))}
      </nav>
    </SidebarShell>
  )
}
