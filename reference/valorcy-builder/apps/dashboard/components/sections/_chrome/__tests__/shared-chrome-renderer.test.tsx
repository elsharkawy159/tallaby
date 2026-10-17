/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/builder/section-migrations', () => ({
  applyMigrations: vi.fn((s) => s),
}))

// The cart lookup is a server action — never reached in these tests (no
// storefront slug), but the import has to resolve.
vi.mock('@/actions/storefront-cart-actions', () => ({
  getCart: vi.fn(async () => ({ items: [], totals: { itemCount: 0 } })),
}))

import { SharedNavbarRenderer } from '@/components/sections/_chrome/shared-navbar-renderer'
import { SharedFooterRenderer } from '@/components/sections/_chrome/shared-footer-renderer'
import { applyChromeModel, toChromeModel } from '@/lib/builder/shared-chrome/adapters'
import { useBuilderStore } from '@/lib/builder/store'
import type { SectionInstance } from '@/components/sections/registry.types'
import type { NavItem, SharedChromeModel } from '@/lib/builder/shared-chrome/types'

function navbar (props: Record<string, unknown> = {}): SectionInstance {
  return {
    id: 'nav-1',
    sectionId: 'navbar-simple',
    version: 2,
    props: {
      logoText: 'Acme',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Pricing', href: '/pricing' },
      ],
      signInText: 'Sign in',
      signInHref: '/login',
      ctaText: 'Start free',
      ctaHref: '/signup',
      showThemeToggle: true,
      ...props,
    },
  }
}

function withModel (
  instance: SectionInstance,
  recipe: (model: SharedChromeModel) => void
): SectionInstance {
  const model = JSON.parse(JSON.stringify(toChromeModel(instance))) as SharedChromeModel
  recipe(model)
  return applyChromeModel(instance, model)
}

const child = (id: string, label: string): NavItem => ({
  id,
  label,
  link: `/${id}`,
  children: [],
})

describe('SharedNavbarRenderer', () => {
  beforeEach(() => {
    useBuilderStore.setState({ sharedHeader: null, sharedFooter: null, sections: [] })
  })

  it('renders legacy flat props with no model present', () => {
    render(<SharedNavbarRenderer instance={navbar()} isPreview />)
    expect(screen.getByText('Home')).toBeDefined()
    expect(screen.getByText('Pricing')).toBeDefined()
    expect(screen.getByText('Start free')).toBeDefined()
    expect(screen.getByText('Sign in')).toBeDefined()
  })

  it('renders nested navigation as a dropdown trigger', () => {
    const instance = withModel(navbar(), (model) => {
      model.navigation[1]!.children = [child('features', 'Features'), child('teams', 'Teams')]
    })
    render(<SharedNavbarRenderer instance={instance} isPreview />)

    const trigger = screen.getByRole('button', { name: /Pricing/ })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    // Collapsed by default — children are not in the DOM until opened.
    expect(screen.queryByText('Features')).toBeNull()
  })

  it('omits hidden navigation items', () => {
    const instance = withModel(navbar(), (model) => {
      model.navigation[0]!.hidden = true
    })
    render(<SharedNavbarRenderer instance={instance} isPreview />)
    expect(screen.queryByText('Home')).toBeNull()
    expect(screen.getByText('Pricing')).toBeDefined()
  })

  it('does not render a disabled component', () => {
    const instance = withModel(navbar(), (model) => {
      const cta = model.components.find((c) => c.type === 'cta')!
      cta.enabled = false
    })
    render(<SharedNavbarRenderer instance={instance} isPreview />)
    expect(screen.queryByText('Start free')).toBeNull()
    expect(screen.getByText('Sign in')).toBeDefined()
  })

  it('renders an added component from the registry defaults', () => {
    const instance = withModel(navbar(), (model) => {
      model.components.push({
        id: 'extra-1',
        type: 'customButton',
        enabled: true,
        slot: 'end',
        visibility: { showDesktop: true, showTablet: true, showMobile: true, auth: 'always' },
        settings: { text: 'Book a demo', link: '/demo', variant: 'outline', size: 'md' },
      })
    })
    render(<SharedNavbarRenderer instance={instance} isPreview />)
    expect(screen.getByText('Book a demo')).toBeDefined()
  })

  it('hides a signed-in-only component from guests', () => {
    const instance = withModel(navbar(), (model) => {
      const cta = model.components.find((c) => c.type === 'cta')!
      cta.visibility.auth = 'loggedIn'
    })
    render(<SharedNavbarRenderer instance={instance} isPreview />)
    expect(screen.queryByText('Start free')).toBeNull()
  })

  it('keeps everything visible on the canvas regardless of auth rules', () => {
    const instance = withModel(navbar(), (model) => {
      const cta = model.components.find((c) => c.type === 'cta')!
      cta.visibility.auth = 'loggedIn'
    })
    render(<SharedNavbarRenderer instance={instance} isPreview={false} />)
    expect(screen.getByText('Start free')).toBeDefined()
  })

  it('always renders a mobile menu trigger', () => {
    render(<SharedNavbarRenderer instance={navbar()} isPreview />)
    expect(screen.getByRole('button', { name: 'Toggle menu' })).toBeDefined()
  })

  it('renders an empty navigation without crashing', () => {
    const instance = withModel(navbar({ links: [] }), (model) => {
      model.navigation = []
    })
    const { container } = render(<SharedNavbarRenderer instance={instance} isPreview />)
    expect(container.querySelector('header')).not.toBeNull()
  })

  it('renders every shipped navbar preset', () => {
    for (const preset of [
      'navbar-simple',
      'navbar-sticky',
      'navbar-pill',
      'navbar-mega',
      'navbar-app',
      'navbar-transparent',
    ]) {
      const { container, unmount } = render(
        <SharedNavbarRenderer instance={{ ...navbar(), sectionId: preset }} isPreview />
      )
      expect(within(container).getAllByText('Home').length).toBeGreaterThan(0)
      unmount()
    }
  })
})

describe('SharedFooterRenderer', () => {
  const footer = (sectionId = 'footer-columns'): SectionInstance => ({
    id: 'foot-1',
    sectionId,
    version: 1,
    props: {
      logoText: 'Acme',
      copyright: '© Acme',
      columns: [
        { title: 'Product', links: [{ label: 'Pricing', href: '/pricing' }] },
        { title: 'Company', links: [{ label: 'About', href: '/about' }] },
      ],
      socials: [{ icon: 'Twitter', label: 'Twitter', href: 'https://x.com/acme' }],
      legal: [{ label: 'Privacy', href: '/privacy' }],
    },
  })

  it('renders columns, links and the copyright from legacy props', () => {
    render(<SharedFooterRenderer instance={footer()} isPreview />)
    expect(screen.getByText('Product')).toBeDefined()
    expect(screen.getByText('Pricing')).toBeDefined()
    expect(screen.getByText('About')).toBeDefined()
    expect(screen.getByText('© Acme')).toBeDefined()
  })

  it('renders policy links for a preset that declares them', () => {
    // `footer-columns` has no legal prop of its own, so the policy links only
    // appear on presets whose key map declares one.
    render(<SharedFooterRenderer instance={footer('footer-simple')} isPreview />)
    expect(screen.getByText('Privacy')).toBeDefined()
  })

  it('substitutes the current year when autoYear is on', () => {
    const instance = withModel(footer(), (model) => {
      const copyright = model.components.find((c) => c.type === 'copyright')!
      copyright.settings = { text: '© {year} Acme', autoYear: true }
    })
    render(<SharedFooterRenderer instance={instance} isPreview />)
    expect(screen.getByText(`© ${new Date().getFullYear()} Acme`)).toBeDefined()
  })

  it('renders every shipped footer preset', () => {
    for (const preset of [
      'footer-simple',
      'footer-minimal',
      'footer-brand',
      'footer-columns',
      'footer-mega',
      'footer-dark',
      'footer-split',
      'footer-legal',
    ]) {
      const { container, unmount } = render(
        <SharedFooterRenderer instance={footer(preset)} isPreview />
      )
      expect(container.querySelector('footer')).not.toBeNull()
      unmount()
    }
  })
})
