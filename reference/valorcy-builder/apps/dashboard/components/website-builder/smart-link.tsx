'use client'

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@workspace/ui/lib/utils'
import {
  resolveLink,
  shouldUseNextLink,
  type LinkValue,
  type ResolveLinkContext,
} from '@/lib/builder/links'

export type SmartLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target'> & {
  /** Fallback when the link value itself doesn't set a target. */
  target?: '_self' | '_blank'
  link: LinkValue
  /** When false (builder canvas), link does not navigate. */
  isPreview?: boolean
  resolveContext?: ResolveLinkContext
  children?: ReactNode
}

/**
 * Auto-detecting link component for builder sections.
 * Uses next/link for internal pages and anchors; raw <a> for external/mailto/tel/file.
 */
export const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(function SmartLink (
  {
    link,
    isPreview = true,
    resolveContext,
    className,
    children,
    onClick,
    ...rest
  },
  ref,
) {
  const resolved = resolveLink(link, resolveContext)
  const canNavigate = isPreview && resolved.href !== '#'

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!canNavigate) {
      event.preventDefault()
    }
    onClick?.(event)
  }

  const linkClassName = cn('cursor-pointer', className)

  const commonProps = {
    ref,
    className: linkClassName,
    onClick: handleClick,
    ...rest,
  }

  if (!canNavigate) {
    return (
      <a
        {...commonProps}
        href={resolved.href !== '#' ? resolved.href : undefined}
        role='link'
        tabIndex={0}
      >
        {children}
      </a>
    )
  }

  if (shouldUseNextLink(resolved)) {
    return (
      <Link
        href={resolved.href}
        className={linkClassName}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  return (
    <a
      {...commonProps}
      href={resolved.href}
      target={resolved.target ?? rest.target}
      rel={resolved.rel ?? rest.rel}
      download={resolved.download || undefined}
    >
      {children}
    </a>
  )
})
