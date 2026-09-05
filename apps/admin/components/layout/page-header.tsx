import { ReactNode } from 'react'

interface PageHeaderProps {
  actions?: ReactNode
}

/** Right-aligned actions toolbar. Page title lives in the navbar. */
export function PageHeader({ actions }: PageHeaderProps) {
  if (!actions) return null

  return (
    <div className="flex items-center justify-end mb-6">
      <div className="flex gap-2">{actions}</div>
    </div>
  )
}
