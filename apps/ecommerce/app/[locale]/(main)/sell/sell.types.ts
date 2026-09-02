import type { LucideIcon } from 'lucide-react'

export interface SellSection {
  id: string
  navKey: string
}

export interface SellFeatureItem {
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
}

export interface SellChecklistItem {
  key: string
}

export interface SellProductPagePart {
  number: number
  titleKey: string
  descriptionKey: string
}

export interface SellFaqItem {
  questionKey: string
  answerKey: string
}

export interface SellCtaProps {
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}
