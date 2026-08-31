'use client'

import { useTranslations } from 'next-intl'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion'

import { FAQ_ITEMS } from './sell.lib'

export function SellFaq() {
  const t = useTranslations('pages.sell')

  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ_ITEMS.map((item, index) => (
        <AccordionItem key={item.questionKey} value={`faq-${index}`}>
          <AccordionTrigger className="text-start">
            {t(item.questionKey)}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t(item.answerKey)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
