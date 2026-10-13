import type { LucideIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { cn } from '@/lib/utils'

/** Text inputs and textareas on this page: 44px tall with a soft teal focus ring. */
export const FIELD_CLASS =
  'h-11 rounded-[10px] bg-card px-3.5 shadow-none transition-[border-color,box-shadow] hover:border-faint focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 dark:bg-card'

export const TEXTAREA_CLASS = cn(FIELD_CLASS, 'h-auto min-h-[104px] py-3 leading-relaxed')

/** Bordered wrapper that joins an addon (icon, `https://`) to an input. */
export const INPUT_GROUP_CLASS =
  'flex items-stretch overflow-hidden rounded-[10px] border border-input bg-card transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20'

export const INPUT_IN_GROUP_CLASS =
  'h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3.5 shadow-none focus-visible:ring-0 dark:bg-transparent'

export const ADDON_CLASS =
  'flex items-center whitespace-nowrap bg-muted px-3 font-mono text-[13px] text-muted-foreground'

/**
 * The design's compact button: 34px, 10px corners (Button `sm` is a pill).
 * `rtl:flex-row` keeps the icon at the start in Arabic, as in the design.
 */
export const SMALL_BUTTON_CLASS = 'h-[34px] rounded-[10px] px-3 text-[13px] font-medium rtl:flex-row'

/** Regular action buttons: 42px tall, 12px corners. */
export const BUTTON_CLASS = 'h-[42px] px-[18px] font-medium rtl:flex-row'

export function SectionCard ({
  id,
  icon: Icon,
  title,
  description,
  tag,
  children,
  className,
}: {
  id: string
  icon: LucideIcon
  title: string
  description: string
  tag?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card
      id={id}
      className={cn(
        'scroll-mt-[136px] gap-0 rounded-2xl py-0 md:scroll-mt-[88px] dark:shadow-none',
        className
      )}
    >
      <CardHeader className='flex items-start gap-3.5 border-b px-4 py-4 sm:px-6 sm:py-5 [.border-b]:pb-4 sm:[.border-b]:pb-5'>
        <SectionIcon icon={Icon} />
        <div className='min-w-0 flex-1'>
          <CardTitle className='text-base leading-normal font-bold'>
            <h2>{title}</h2>
          </CardTitle>
          <CardDescription className='mt-0.5 text-[13px] leading-relaxed text-pretty'>
            {description}
          </CardDescription>
        </div>
        {tag ? <div className='hidden shrink-0 sm:block'>{tag}</div> : null}
      </CardHeader>
      <CardContent className='flex flex-col gap-4 p-4 sm:gap-5 sm:p-6'>
        {children}
      </CardContent>
    </Card>
  )
}

export function SectionIcon ({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className='grid size-9.5 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary-ink'>
      <Icon className='size-[18px]' />
    </div>
  )
}

/** Field label with an optional muted note on the opposite side. */
export function LabelNote ({ children }: { children: React.ReactNode }) {
  return (
    <span className='text-xs font-normal whitespace-nowrap text-faint'>
      {children}
    </span>
  )
}

export function FieldHint ({
  children,
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}
