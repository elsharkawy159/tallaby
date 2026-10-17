'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { AnimationConfig } from '@/lib/builder/component-style'

interface AnimationWrapperProps {
  animation?: AnimationConfig
  sectionId: string
  isSelected?: boolean
  children: React.ReactNode
}

export function AnimationWrapper ({
  animation,
  sectionId,
  isSelected,
  children,
}: AnimationWrapperProps) {
  const type = animation?.type ?? null
  const ref = useRef<HTMLDivElement>(null)

  const triggerAnimation = useCallback(() => {
    const el = ref.current
    if (!el || !type) return
    el.classList.remove('anim-running')
    el.classList.remove('anim-done')
    void el.offsetHeight
    el.classList.add('anim-running')
    const onEnd = () => {
      el.classList.remove('anim-running')
      el.classList.remove('anim-ready')
      el.classList.add('anim-done')
      el.removeEventListener('animationend', onEnd)
    }
    el.addEventListener('animationend', onEnd)
  }, [type])

  useEffect(() => {
    const el = ref.current
    if (!el || !type) return
    el.classList.add('anim-ready')
    el.dataset.animType = type
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          triggerAnimation()
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [type, triggerAnimation])

  useEffect(() => {
    if (isSelected && type) {
      triggerAnimation()
    }
  }, [isSelected, type, triggerAnimation])

  if (!type) return <>{children}</>

  return (
    <div ref={ref} data-section-id={sectionId}>
      {children}
    </div>
  )
}
