import { Image as ImageIcon, Play, Star, Shapes } from 'lucide-react'
import type { ShadcnComponentType } from '@/lib/builder/component-node'
import { cn } from '@workspace/ui/lib/utils'

/**
 * CSS-generated mini-preview for a component type. Purely decorative — gives the palette
 * (and the drag ghost) a meaningful visual instead of a generic box. Sized by the parent
 * via className; defaults to a square chip.
 */
export function ElementPreview ({
  type,
  className,
}: {
  type: ShadcnComponentType
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-border/70 bg-muted/40 text-muted-foreground',
        className
      )}
    >
      <Sketch type={type} />
    </div>
  )
}

const bar = 'rounded-[1px] bg-current'

function Sketch ({ type }: { type: ShadcnComponentType }) {
  switch (type) {
    case 'section':
      return (
        <div className="flex h-full w-full items-center justify-center p-[3px]">
          <div className="h-[60%] w-full rounded-[2px] border border-current/60" />
        </div>
      )
    case 'container':
      return (
        <div className="flex h-full w-full items-center justify-center border border-dashed border-current/50 p-[2px]">
          <div className="h-[55%] w-[60%] rounded-[2px] bg-current/50" />
        </div>
      )
    case 'vFlex':
    case 'quickStack':
    case 'stack':
      return (
        <div className="flex h-full w-full flex-col justify-center gap-[2px] p-[3px]">
          <div className={cn(bar, 'h-[3px] w-full opacity-70')} />
          <div className={cn(bar, 'h-[3px] w-full opacity-70')} />
          <div className={cn(bar, 'h-[3px] w-full opacity-70')} />
        </div>
      )
    case 'hFlex':
    case 'flex':
      return (
        <div className="flex h-full w-full items-stretch justify-center gap-[2px] p-[3px]">
          <div className={cn(bar, 'w-1/3 opacity-70')} />
          <div className={cn(bar, 'w-1/3 opacity-70')} />
          <div className={cn(bar, 'w-1/3 opacity-70')} />
        </div>
      )
    case 'list':
      return (
        <div className="flex h-full w-full flex-col justify-center gap-[2px] p-[3px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-[2px]">
              <div className="size-[3px] rounded-full bg-current opacity-70" />
              <div className={cn(bar, 'h-[2px] flex-1 opacity-60')} />
            </div>
          ))}
        </div>
      )
    case 'listItem':
      return (
        <div className="flex h-full w-full items-center gap-[2px] p-[3px]">
          <div className="size-[3px] rounded-full bg-current opacity-70" />
          <div className={cn(bar, 'h-[2px] flex-1 opacity-60')} />
        </div>
      )
    case 'heading':
      return (
        <div className="flex h-full w-full flex-col justify-center gap-[2px] p-[3px]">
          <div className={cn(bar, 'h-[4px] w-[80%]')} />
          <div className={cn(bar, 'h-[2px] w-[55%] opacity-50')} />
        </div>
      )
    case 'paragraph':
    case 'richText':
    case 'blockQuote':
      return (
        <div className="flex h-full w-full flex-col justify-center gap-[2px] p-[3px]">
          <div className={cn(bar, 'h-[2px] w-full opacity-60')} />
          <div className={cn(bar, 'h-[2px] w-full opacity-60')} />
          <div className={cn(bar, 'h-[2px] w-[70%] opacity-60')} />
        </div>
      )
    case 'text':
    case 'label':
      return (
        <div className="flex h-full w-full items-center justify-center p-[3px]">
          <div className={cn(bar, 'h-[3px] w-[70%] opacity-70')} />
        </div>
      )
    case 'button':
    case 'linkBlock':
    case 'textLink':
      return (
        <div className="flex h-full w-full items-center justify-center p-[3px]">
          <div className="h-[8px] w-[70%] rounded-full bg-current opacity-80" />
        </div>
      )
    case 'shadcn-badge':
      return (
        <div className="flex h-full w-full items-center justify-center p-[3px]">
          <div className="h-[6px] w-[50%] rounded-full border border-current/70" />
        </div>
      )
    case 'image':
      return <ImageIcon className="size-3.5" strokeWidth={1.75} />
    case 'icon':
      return <Shapes className="size-3.5" strokeWidth={1.75} />
    case 'video':
      return <Play className="size-3.5" strokeWidth={1.75} />
    case 'shadcn-avatar':
      return <div className="size-[14px] rounded-full bg-current opacity-70" />
    case 'shadcn-card':
      return (
        <div className="flex h-full w-full flex-col gap-[2px] p-[2px]">
          <div className="h-[8px] w-full rounded-[2px] bg-current opacity-40" />
          <div className={cn(bar, 'h-[2px] w-[80%] opacity-60')} />
          <div className={cn(bar, 'h-[2px] w-[60%] opacity-60')} />
        </div>
      )
    case 'input':
    case 'textarea':
    case 'search':
    case 'select':
    case 'colorInput':
      return (
        <div className="flex h-full w-full items-center justify-center p-[3px]">
          <div className="h-[9px] w-full rounded-[2px] border border-current/60" />
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex h-full w-full items-center gap-[2px] p-[3px]">
          <div className="size-[6px] rounded-[1px] border border-current/70" />
          <div className={cn(bar, 'h-[2px] flex-1 opacity-50')} />
        </div>
      )
    case 'radio':
      return (
        <div className="flex h-full w-full items-center gap-[2px] p-[3px]">
          <div className="size-[6px] rounded-full border border-current/70" />
          <div className={cn(bar, 'h-[2px] flex-1 opacity-50')} />
        </div>
      )
    case 'shadcn-tooltip':
      return <Star className="size-3.5" strokeWidth={1.75} />
    default:
      return (
        <div className="flex h-full w-full items-center justify-center p-[3px]">
          <div className="size-full rounded-[2px] border border-current/40" />
        </div>
      )
  }
}
