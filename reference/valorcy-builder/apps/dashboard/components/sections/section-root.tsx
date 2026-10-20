'use client'

import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@workspace/ui/lib/utils'
import type { ComponentStyle } from '@/lib/builder/component-style'
import { SectionContainer } from '@/components/sections/section-container'
import {
  useSectionSurface,
  type SectionRootStyleOptions,
} from '@/components/sections/section-surface'

type SectionRootTag = 'section' | 'header' | 'footer' | 'article' | 'main'

export type SectionRootProps = {
  as?: SectionRootTag
  instanceId: string
  defaultStyle?: Partial<ComponentStyle>
  rootOptions?: SectionRootStyleOptions
  className?: string
  style?: CSSProperties
  children: React.ReactNode
} & Omit<HTMLAttributes<HTMLElement>, 'style' | 'className' | 'children'>

export function SectionRoot ({
  as: Tag = 'section',
  instanceId,
  defaultStyle,
  rootOptions,
  className,
  style,
  children,
  ...rest
}: SectionRootProps) {
  const { rootStyle } = useSectionSurface({
    instanceId,
    defaultStyle,
    rootOptions,
  })

  return (
    <Tag
      {...rest}
      className={cn('text-foreground', className)}
      style={{ ...rootStyle, ...style }}
    >
      <SectionContainer>{children}</SectionContainer>
    </Tag>
  )
}

/** Presentational shell: `<section|footer|header style={rootStyle}><SectionContainer>…` */
export type SectionLayoutProps = {
  as?: SectionRootTag
  className?: string
  rootStyle: CSSProperties
  containerClassName?: string
  children: React.ReactNode
} & Omit<HTMLAttributes<HTMLElement>, 'style' | 'className' | 'children'>

export function SectionLayout ({
  as: Tag = 'section',
  className,
  rootStyle,
  containerClassName,
  children,
  ...rest
}: SectionLayoutProps) {
  return (
    <Tag className={className} style={rootStyle} {...rest}>
      <SectionContainer className={containerClassName}>
        {children}
      </SectionContainer>
    </Tag>
  )
}
