
'use client'

import { useMemo } from 'react'
import { useBuilderStore } from '@/lib/builder/store'
import { sectionRegistry } from '@/components/sections'
import { ComponentTreeRenderer } from '@/components/website-builder/component-tree-renderer'
import { AnimationWrapper } from '@/components/website-builder/animation-wrapper'
import {
  designSystemToThemeCss,
  SITE_THEME_ROOT_CLASS,
} from '@/lib/builder/design-system-css-vars'

export function BuilderSectionsPreview () {
  const sections = useBuilderStore((s) => s.sections)
  const designSystem = useBuilderStore((s) => s.designSystem)

  const themeCss = useMemo(
    () => designSystemToThemeCss(designSystem),
    [designSystem]
  )

  return (
    <div
      className={`min-h-dvh w-full bg-background text-foreground ${SITE_THEME_ROOT_CLASS}`}
    >
      {themeCss ? <style>{themeCss}</style> : null}
      {sections.map((instance) => {
        const def = sectionRegistry.get(instance.sectionId)
        const C = def?.Component
        if (!C) return null
        return (
          <AnimationWrapper key={instance.id} animation={instance.animation} sectionId={instance.id}>
            <C instance={instance} isPreview />
            {instance.componentTree && instance.componentTree.length > 0 ? (
              <ComponentTreeRenderer
                sectionId={instance.id}
                tree={instance.componentTree}
                isPreview
              />
            ) : null}
          </AnimationWrapper>
        )
      })}
    </div>
  )
}


