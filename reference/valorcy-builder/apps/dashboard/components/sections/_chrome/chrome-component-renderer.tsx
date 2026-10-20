'use client'

import { ArrowRight, Bell, Heart, Loader2, Search, ShoppingCart, User } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'

import { BrandLogo } from '@/components/sections/_primitives/brand-logo'
import { NavbarThemeToggle } from '@/components/sections/_primitives/navbar-theme-toggle'
import {
  NavbarLanguageSwitcher,
  type LanguageSwitcherStyle,
} from '@/components/sections/_primitives/navbar-language-switcher'
import { InlineEditableText } from '@/components/website-builder/inline-editable'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import { SectionLink } from '@/components/website-builder/section-link'
import { usePublicSiteContext } from '@/components/website-builder/public-site-context'
import type { DesignSystem } from '@/lib/builder/store'
import type { LinkValue } from '@/lib/builder/links'
import type { ChromeComponent } from '@/lib/builder/shared-chrome/types'
import { withNewTab } from './link-utils'
import { iconKey } from './social-options'

/**
 * Renders one built-in chrome component.
 *
 * Every branch reuses the existing section primitives (`BrandLogo`,
 * `NavbarThemeToggle`, `NavbarLanguageSwitcher`, `SectionLink`,
 * `InlineEditableText`) and emits the same `data-element-*` attributes the
 * hand-written navbars used, so canvas selection, inline editing and per-element
 * styling all keep working exactly as before.
 */

export interface ChromeComponentContext {
  instanceId: string
  isPreview: boolean
  ds: DesignSystem
  /** Preset-specific class overrides. */
  ctaClass?: string
  secondaryClass?: string
  /** Canvas-only: commit a settings edit made inline. */
  onSettingChange?: (componentId: string, patch: Record<string, unknown>) => void
}

const BUTTON_SIZE: Record<string, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-5 text-sm',
}

function s (settings: Record<string, unknown>, key: string, fallback = ''): string {
  const value = settings[key]
  return typeof value === 'string' ? value : fallback
}

function ButtonLike ({
  component,
  ctx,
  variantFallback,
  elementIdSuffix,
  textPropKey,
}: {
  component: ChromeComponent
  ctx: ChromeComponentContext
  variantFallback: string
  elementIdSuffix: string
  textPropKey: string
}) {
  const settings = component.settings as Record<string, unknown>
  const variant = s(settings, 'variant', variantFallback)
  const size = s(settings, 'size', 'md')
  const radius = typeof settings.radius === 'number' ? settings.radius : undefined
  const label = s(settings, 'text')
  const primary = ctx.ds.colors.primary

  const variantClass =
    variant === 'primary'
      ? 'font-medium transition-all hover:-translate-y-px'
      : variant === 'secondary'
        ? 'border border-border bg-muted font-medium text-foreground hover:bg-muted/70'
        : variant === 'outline'
          ? 'border border-border font-medium text-foreground hover:bg-muted/60'
          : variant === 'link'
            ? 'font-medium text-foreground underline-offset-4 hover:underline'
            : 'font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground'

  const style =
    variant === 'primary'
      ? {
          color: 'var(--primary-foreground)',
          background: primary,
          boxShadow: `0 0 0 1px color-mix(in oklch, ${primary} 30%, transparent), var(--shadow-xs, 0 1px 2px rgb(0 0 0 / 0.06))`,
          ...(radius != null ? { borderRadius: radius } : {}),
        }
      : radius != null
        ? { borderRadius: radius }
        : undefined

  return (
    <SectionLink
      link={withNewTab(settings.link as LinkValue, Boolean(settings.newTab))}
      isPreview={ctx.isPreview}
      data-element-id={`${ctx.instanceId}::${elementIdSuffix}`}
      data-element-type="textLink"
      data-element-href-prop={`${textPropKey}Href`}
      data-analytics-event={s(settings, 'analyticsEvent') || undefined}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md',
        BUTTON_SIZE[size] ?? BUTTON_SIZE.md,
        variantClass,
        ctx.ctaClass && variant === 'primary' ? ctx.ctaClass : undefined
      )}
      style={style}
    >
      {settings.loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {s(settings, 'iconLeft') ? <LucideIcon name={iconKey(s(settings, 'iconLeft'))} size={14} /> : null}
      <InlineEditableText
        as="span"
        data-element-id={`${ctx.instanceId}::${elementIdSuffix}Text`}
        data-element-type="text"
        value={label}
        isPreview={ctx.isPreview}
        onChange={(t) => ctx.onSettingChange?.(component.id, { text: t })}
        onCommit={(t) => ctx.onSettingChange?.(component.id, { text: t })}
      />
      {s(settings, 'iconRight') ? (
        <LucideIcon name={iconKey(s(settings, 'iconRight'))} size={14} />
      ) : variant === 'primary' && !s(settings, 'iconLeft') ? (
        <ArrowRight size={14} aria-hidden className="rtl:rotate-180" />
      ) : null}
    </SectionLink>
  )
}

function IconAction ({
  component,
  ctx,
  Icon,
  label,
  count,
}: {
  component: ChromeComponent
  ctx: ChromeComponentContext
  Icon: typeof ShoppingCart
  label: string
  count?: number
}) {
  const settings = component.settings as Record<string, unknown>
  return (
    <SectionLink
      link={(settings.link as LinkValue) ?? '#'}
      isPreview={ctx.isPreview}
      aria-label={label}
      className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon size={17} aria-hidden />
      {settings.showCount && count && count > 0 ? (
        <span
          className="absolute -end-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
          style={{ background: ctx.ds.colors.primary }}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </SectionLink>
  )
}

export function ChromeComponentRenderer ({
  component,
  ctx,
}: {
  component: ChromeComponent
  ctx: ChromeComponentContext
}) {
  const settings = component.settings as Record<string, unknown>
  const site = usePublicSiteContext()

  switch (component.type) {
    case 'logo': {
      const height = typeof settings.height === 'number' ? settings.height : 28
      return (
        <BrandLogo
          instanceId={ctx.instanceId}
          logoText={s(settings, 'text')}
          isPreview={ctx.isPreview}
          size={height}
        />
      )
    }

    case 'themeToggle': {
      const style = s(settings, 'style', 'icon')
      return (
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <NavbarThemeToggle
            className={cn(
              style === 'switch' && 'rounded-full border border-border',
              style === 'segmented' && 'rounded-md border border-border',
              settings.animation === 'rotate' && 'transition-transform hover:rotate-12'
            )}
          />
          {settings.showLabel ? (
            <span className="text-sm text-muted-foreground">Theme</span>
          ) : null}
        </span>
      )
    }

    case 'languageSwitcher': {
      const display = s(settings, 'display', 'code')
      // `flagName` is a renderer-level combination; the primitive takes the
      // catalog's own label styles.
      const switcherStyle = (display === 'flagName' ? 'flag' : display) as LanguageSwitcherStyle
      const locales = (settings.supportedLanguages as string[]) ?? site?.supportedLocales ?? ['en']
      if (locales.length < 2) return null
      return (
        <NavbarLanguageSwitcher
          supportedLocales={locales}
          defaultLocale={s(settings, 'defaultLanguage') || site?.defaultLocale || 'en'}
          switcherStyle={switcherStyle}
        />
      )
    }

    case 'search': {
      if (s(settings, 'style', 'icon') === 'input') {
        return (
          <span className="relative hidden min-w-[180px] items-center md:inline-flex">
            <Search
              size={14}
              aria-hidden
              className="pointer-events-none absolute start-2.5 text-muted-foreground"
            />
            <input
              type="search"
              readOnly={!ctx.isPreview}
              placeholder={s(settings, 'placeholder', 'Search…')}
              className="h-9 w-full rounded-md border border-border bg-muted/40 ps-8 pe-3 text-sm outline-none focus:border-primary/40"
            />
          </span>
        )
      }
      return (
        <button
          type="button"
          aria-label="Search"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search size={17} aria-hidden />
        </button>
      )
    }

    case 'cart':
      return (
        <IconAction component={component} ctx={ctx} Icon={ShoppingCart} label="Cart" count={0} />
      )

    case 'wishlist':
      return <IconAction component={component} ctx={ctx} Icon={Heart} label="Wishlist" count={0} />

    case 'notifications':
      return (
        <IconAction component={component} ctx={ctx} Icon={Bell} label="Notifications" count={0} />
      )

    case 'avatar': {
      const initials = s(settings, 'initials') || 'AC'
      return (
        <SectionLink
          link={(settings.link as LinkValue) ?? '#'}
          isPreview={ctx.isPreview}
          aria-label="Account"
          className="inline-flex shrink-0 items-center gap-2 rounded-md p-0.5 hover:bg-muted"
        >
          <span
            className="inline-flex size-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklch, ${ctx.ds.colors.primary} 60%, white), ${ctx.ds.colors.primary})`,
            }}
            aria-hidden
          >
            {initials.slice(0, 2).toUpperCase() || <User size={14} />}
          </span>
          {settings.showName ? (
            <span className="text-sm font-medium text-foreground">Account</span>
          ) : null}
        </SectionLink>
      )
    }

    case 'cta':
      return (
        <ButtonLike
          component={component}
          ctx={ctx}
          variantFallback="primary"
          elementIdSuffix="ctaButton"
          textPropKey="cta"
        />
      )

    case 'customButton':
      return (
        <ButtonLike
          component={component}
          ctx={ctx}
          variantFallback="outline"
          elementIdSuffix={`customButton-${component.id}`}
          textPropKey="custom"
        />
      )

    case 'login':
    case 'register':
      return (
        <SectionLink
          link={withNewTab(settings.link as LinkValue, Boolean(settings.newTab))}
          isPreview={ctx.isPreview}
          data-element-id={`${ctx.instanceId}::signInLink`}
          data-element-type="textLink"
          data-element-href-prop="signInHref"
          className={cn(
            'shrink-0 rounded-md px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
            ctx.secondaryClass
          )}
        >
          <InlineEditableText
            as="span"
            data-element-id={`${ctx.instanceId}::signInText`}
            data-element-type="text"
            value={s(settings, 'text')}
            isPreview={ctx.isPreview}
            onChange={(t) => ctx.onSettingChange?.(component.id, { text: t })}
            onCommit={(t) => ctx.onSettingChange?.(component.id, { text: t })}
          />
        </SectionLink>
      )

    case 'social': {
      const items = (settings.items as { icon?: string; label?: string; href?: string }[]) ?? []
      const size = typeof settings.size === 'number' ? settings.size : 18
      if (items.length === 0) return null
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((item, index) => (
            <SectionLink
              key={index}
              link={item.href ?? '#'}
              isPreview={ctx.isPreview}
              aria-label={item.label ?? 'Social link'}
              className="inline-flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LucideIcon name={iconKey(item.icon) || 'link'} size={size} />
              {settings.style === 'iconLabel' && item.label ? (
                <span className="text-sm">{item.label}</span>
              ) : null}
            </SectionLink>
          ))}
        </div>
      )
    }

    case 'legal': {
      const items = (settings.items as { label?: string; href?: string }[]) ?? []
      if (items.length === 0) return null
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {items.map((item, index) => (
            <SectionLink
              key={index}
              link={item.href ?? '#'}
              isPreview={ctx.isPreview}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </SectionLink>
          ))}
        </div>
      )
    }

    case 'copyright': {
      const raw = s(settings, 'text')
      const text = settings.autoYear
        ? raw.replace(/\{year\}/g, String(new Date().getFullYear()))
        : raw
      return (
        <InlineEditableText
          as="p"
          data-element-id={`${ctx.instanceId}::copyright`}
          data-element-type="text"
          className="text-xs text-muted-foreground"
          value={text}
          isPreview={ctx.isPreview}
          onChange={(t) => ctx.onSettingChange?.(component.id, { text: t })}
          onCommit={(t) => ctx.onSettingChange?.(component.id, { text: t })}
        />
      )
    }

    case 'newsletter':
      return (
        <form
          className="flex w-full max-w-sm flex-col gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          {s(settings, 'title') ? (
            <p className="text-sm font-semibold text-foreground">{s(settings, 'title')}</p>
          ) : null}
          {s(settings, 'description') ? (
            <p className="text-xs text-muted-foreground">{s(settings, 'description')}</p>
          ) : null}
          <div className="flex gap-2">
            <input
              type="email"
              readOnly={!ctx.isPreview}
              placeholder={s(settings, 'placeholder', 'you@example.com')}
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary/40"
            />
            <button
              type="submit"
              className="h-9 shrink-0 rounded-md px-3.5 text-sm font-medium"
              style={{ background: ctx.ds.colors.primary, color: 'var(--primary-foreground)' }}
            >
              {s(settings, 'buttonText', 'Subscribe')}
            </button>
          </div>
        </form>
      )

    case 'customBlock': {
      const text = s(settings, 'text')
      if (!text) return null
      return (
        <InlineEditableText
          as="p"
          data-element-id={`${ctx.instanceId}::tagline`}
          data-element-type="text"
          className="text-sm leading-relaxed text-muted-foreground"
          value={text}
          isPreview={ctx.isPreview}
          onChange={(t) => ctx.onSettingChange?.(component.id, { text: t })}
          onCommit={(t) => ctx.onSettingChange?.(component.id, { text: t })}
        />
      )
    }

    // `navigation` and `linkColumn` are laid out by the chrome renderers
    // themselves, since they need the model's navigation tree.
    default:
      return null
  }
}
