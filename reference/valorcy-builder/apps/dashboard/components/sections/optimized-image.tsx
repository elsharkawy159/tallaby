'use client'

import Image from 'next/image'
import type { CSSProperties, MouseEventHandler } from 'react'
import { cn } from '@workspace/ui/lib/utils'

/** Returns false for sources Next.js image optimization cannot handle reliably. */
export function isOptimizableImageSrc (src: string | undefined | null): boolean {
  if (!src || !src.trim()) return false
  if (src.startsWith('data:') || src.startsWith('blob:')) return false
  if (/\.svg(\?|#|$)/i.test(src)) return false
  return true
}

export type OptimizedImageProps = {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLImageElement>
} & Record<string, unknown>

export function OptimizedImage ({
  src,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  fill = true,
  width,
  height,
  style,
  onClick,
  ...rest
}: OptimizedImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(className)}
        style={style}
        onClick={onClick}
        {...rest}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1}
      height={height ?? 1}
      sizes={sizes}
      priority={priority}
      className={cn(className)}
      style={style}
      onClick={onClick}
      {...rest}
    />
  )
}
