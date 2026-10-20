'use client'

import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb'
import { Link, usePathname } from '@/i18n/navigation'
import { useProjectContext } from '@/components/providers/project-context-provider'
import { useCmsCollections } from '@/components/cms/cms-collections-provider'

const SECTION_LABELS: Record<string, string> = {
  builder: 'Builder',
  pages: 'Pages',
  cms: 'CMS',
  analytics: 'Analytics',
  domain: 'Domain',
  settings: 'Settings',
}

/** Title-case a slug as a fallback when a collection name isn't loaded yet. */
function humanizeSlug (slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const SETTINGS_TAB_LABELS: Record<string, string> = {
  general: 'General',
  website: 'Domain',
  design: 'Design',
  assets: 'Assets',
  danger: 'Danger Zone',
}

interface Crumb {
  label: string
  href?: string
}

export function ProjectBreadcrumb () {
  const tHeaders = useTranslations('pages.pageHeaders')
  const tCms = useTranslations('cms.breadcrumb')
  const { projectId, projectName } = useProjectContext()
  const { collections } = useCmsCollections()
  const pathname = usePathname() ?? ''

  let dashboardLabel = 'Dashboard'
  try {
    dashboardLabel = tHeaders('overview.title')
  } catch {
    // fall back to default
  }

  // Strip the /projects/<id> prefix to find the current section.
  const afterId = pathname.split(`/projects/${projectId}`)[1] ?? ''
  const segments = afterId.split('/').filter(Boolean)
  const section = segments[0] ?? null
  const subSection = segments[1] ?? null
  const leaf = segments[2] ?? null

  const base = `/projects/${projectId}`
  const crumbs: Crumb[] = [{ label: dashboardLabel, href: '/' }]

  // Project crumb — a link once we're inside any section.
  crumbs.push({ label: projectName, href: section ? base : undefined })

  if (section === 'cms') {
    if (!subSection) {
      crumbs.push({ label: SECTION_LABELS.cms! })
    } else {
      crumbs.push({ label: SECTION_LABELS.cms!, href: `${base}/cms` })
      const name =
        collections.find((c) => c.slug === subSection)?.name ?? humanizeSlug(subSection)
      if (!leaf) {
        crumbs.push({ label: name })
      } else {
        crumbs.push({ label: name, href: `${base}/cms/${subSection}` })
        const leafLabel =
          leaf === 'new' ? tCms('new') : leaf === 'schema' ? tCms('schema') : tCms('edit')
        crumbs.push({ label: leafLabel })
      }
    }
  } else if (section === 'settings') {
    if (subSection) {
      crumbs.push({ label: SECTION_LABELS.settings!, href: `${base}/settings` })
      crumbs.push({ label: SETTINGS_TAB_LABELS[subSection] ?? subSection })
    } else {
      crumbs.push({ label: SECTION_LABELS.settings! })
    }
  } else if (section) {
    crumbs.push({ label: SECTION_LABELS[section] ?? section })
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href as any}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
