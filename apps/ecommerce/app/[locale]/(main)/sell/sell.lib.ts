import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Package,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react'

import type {
  SellChecklistItem,
  SellFeatureItem,
  SellFaqItem,
  SellProductPagePart,
  SellSection,
} from './sell.types'

export const SELL_SECTIONS: SellSection[] = [
  { id: 'introduction', navKey: 'introduction' },
  { id: 'before-you-start', navKey: 'beforeYouStart' },
  { id: 'seller-dashboard', navKey: 'sellerDashboard' },
  { id: 'listing-products', navKey: 'listingProducts' },
  { id: 'product-page', navKey: 'productPage' },
  { id: 'fulfillment', navKey: 'fulfillment' },
  { id: 'after-sale', navKey: 'afterSale' },
  { id: 'growth', navKey: 'growth' },
  { id: 'checklist', navKey: 'checklist' },
]

export const INTRODUCTION_FEATURES: SellFeatureItem[] = [
  {
    icon: Store,
    titleKey: 'introductionFeature1Title',
    descriptionKey: 'introductionFeature1Description',
  },
  {
    icon: ShoppingBag,
    titleKey: 'introductionFeature2Title',
    descriptionKey: 'introductionFeature2Description',
  },
  {
    icon: ShieldCheck,
    titleKey: 'introductionFeature3Title',
    descriptionKey: 'introductionFeature3Description',
  },
]

export const DASHBOARD_FEATURES: SellFeatureItem[] = [
  {
    icon: LayoutDashboard,
    titleKey: 'dashboardFeature1Title',
    descriptionKey: 'dashboardFeature1Description',
  },
  {
    icon: Package,
    titleKey: 'dashboardFeature2Title',
    descriptionKey: 'dashboardFeature2Description',
  },
  {
    icon: BarChart3,
    titleKey: 'dashboardFeature3Title',
    descriptionKey: 'dashboardFeature3Description',
  },
]

export const LISTING_STEPS: SellChecklistItem[] = [
  { key: 'listingStep1' },
  { key: 'listingStep2' },
  { key: 'listingStep3' },
  { key: 'listingStep4' },
  { key: 'listingStep5' },
]

export const PRODUCT_PAGE_PARTS: SellProductPagePart[] = [
  { number: 1, titleKey: 'productPart1Title', descriptionKey: 'productPart1Description' },
  { number: 2, titleKey: 'productPart2Title', descriptionKey: 'productPart2Description' },
  { number: 3, titleKey: 'productPart3Title', descriptionKey: 'productPart3Description' },
  { number: 4, titleKey: 'productPart4Title', descriptionKey: 'productPart4Description' },
  { number: 5, titleKey: 'productPart5Title', descriptionKey: 'productPart5Description' },
  { number: 6, titleKey: 'productPart6Title', descriptionKey: 'productPart6Description' },
]

export const FULFILLMENT_FEATURES: SellFeatureItem[] = [
  {
    icon: Truck,
    titleKey: 'fulfillmentFeature1Title',
    descriptionKey: 'fulfillmentFeature1Description',
  },
  {
    icon: Package,
    titleKey: 'fulfillmentFeature2Title',
    descriptionKey: 'fulfillmentFeature2Description',
  },
  {
    icon: ShieldCheck,
    titleKey: 'fulfillmentFeature3Title',
    descriptionKey: 'fulfillmentFeature3Description',
  },
]

export const GROWTH_FEATURES: SellFeatureItem[] = [
  {
    icon: Megaphone,
    titleKey: 'growthFeature1Title',
    descriptionKey: 'growthFeature1Description',
  },
  {
    icon: ClipboardList,
    titleKey: 'growthFeature2Title',
    descriptionKey: 'growthFeature2Description',
  },
  {
    icon: Rocket,
    titleKey: 'growthFeature3Title',
    descriptionKey: 'growthFeature3Description',
  },
]

export const CHECKLIST_ITEMS: SellChecklistItem[] = [
  { key: 'checklistItem1' },
  { key: 'checklistItem2' },
  { key: 'checklistItem3' },
  { key: 'checklistItem4' },
  { key: 'checklistItem5' },
  { key: 'checklistItem6' },
]

export const FAQ_ITEMS: SellFaqItem[] = [
  { questionKey: 'faq1Question', answerKey: 'faq1Answer' },
  { questionKey: 'faq2Question', answerKey: 'faq2Answer' },
  { questionKey: 'faq3Question', answerKey: 'faq3Answer' },
]

export const REQUIREMENTS_ITEMS: SellChecklistItem[] = [
  { key: 'requirement1' },
  { key: 'requirement2' },
  { key: 'requirement3' },
  { key: 'requirement4' },
  { key: 'requirement5' },
]
