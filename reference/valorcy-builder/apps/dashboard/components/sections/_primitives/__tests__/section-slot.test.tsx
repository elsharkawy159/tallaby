/**
 * @vitest-environment jsdom
 *
 * Renders the real hero components through `<SectionSlot>`.
 *
 * The unit tests around slot entries and drop resolution cover the decisions;
 * this covers the thing those cannot — that a hero actually *renders* its slots,
 * in the right order, with the right content, and that an untouched instance
 * still produces the markup it did before slots existed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

// A compiler-replaced placeholder under Cache Components; it throws when
// imported outside a Next build.
vi.mock('next/root-params', () => ({
  locale: vi.fn(async () => 'en'),
}))

vi.mock('@/lib/builder/section-migrations', () => ({
  applyMigrations: vi.fn((s) => s),
}))

// `useSectionSurface` breaks the section↔store import cycle with a lazy CommonJS
// `require`, which Vitest's ESM transform cannot resolve. It only supplies the
// section root's background/padding, which is not what these tests are about.
vi.mock('@/components/sections/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/sections/shared')>()),
  useSectionSurface: () => ({ rootStyle: {} }),
}))

import { sectionRegistry } from '@/components/sections'
import { useBuilderStore } from '@/lib/builder/store'
import { PublicSiteProvider } from '@/components/website-builder/public-site-context'
import { BuilderDndProvider } from '@/components/website-builder/dnd/builder-dnd-provider'
import { slotHostElementId } from '@/lib/builder/dnd/ids'
import type { ComponentNode } from '@/lib/builder/component-node'
import type { SectionInstance } from '@/components/sections/registry.types'

/**
 * Fixed copy for the Momentum ordering tests, so they pin slot structure rather
 * than whatever marketing copy the section ships with by default (the default
 * has no badge or accent word).
 */
const MOMENTUM_FIXTURE = {
  badge: 'New release',
  headline: 'Ship your next idea',
  accentWord: 'faster',
  note: 'No credit card required.',
}

function instanceOf (sectionId: string, overrides: Partial<SectionInstance> = {}): SectionInstance {
  const def = sectionRegistry.get(sectionId)!
  return {
    id: 'inst1',
    sectionId,
    version: def.version ?? 1,
    props: { ...def.defaultProps, ...(sectionId === 'hero-momentum' ? MOMENTUM_FIXTURE : {}) },
    ...overrides,
  }
}

/**
 * Renders on the public path, which takes the same `<SectionSlot>` code without
 * any dnd-kit hooks — so what it produces is exactly what a published page does.
 */
function renderPublic (instance: SectionInstance) {
  const def = sectionRegistry.get(instance.sectionId)!
  const Component = def.Component
  const state = useBuilderStore.getState()
  return render(
    <PublicSiteProvider designSystem={state.designSystem} sections={[instance]}>
      <Component instance={instance} isPreview />
    </PublicSiteProvider>
  )
}

/** Visible text of the elements a slot's schema blocks render, in DOM order. */
function textOrder (container: HTMLElement, selectors: string[]): string[] {
  const nodes = container.querySelectorAll<HTMLElement>(selectors.join(','))
  return [...nodes].map((n) => n.textContent?.trim() ?? '').filter(Boolean)
}

beforeEach(() => {
  useBuilderStore.setState({ injectedChildren: {}, sections: [] })
})

describe('a hero with no stored layout', () => {
  it('renders its blocks in schema order', () => {
    const { container } = renderPublic(instanceOf('hero-momentum'))

    // badge → headline → description → buttons → note, as the schema declares.
    expect(textOrder(container, ['span', 'h1', 'p', 'a'])).toEqual(
      expect.arrayContaining([
        'New release',
        'Ship your next idea',
        'faster',
        'No credit card required.',
      ])
    )

    const html = container.innerHTML
    expect(html.indexOf('New release')).toBeLessThan(html.indexOf('Ship your next idea'))
    expect(html.indexOf('Ship your next idea')).toBeLessThan(
      html.indexOf('No credit card required.')
    )
  })

  it('renders the hero headline as an h1', () => {
    // SectionHeader used to hardcode h2, which is why most heroes hand-rolled
    // their own heading rather than use the primitive.
    for (const def of sectionRegistry.getAll().filter((d) => d.category === 'hero')) {
      const hasHeadingBlock = def.schema?.blocks.some((b) => b.kind === 'heading')
      if (!hasHeadingBlock) continue
      const { container, unmount } = renderPublic(instanceOf(def.id))
      expect(container.querySelector('h1'), `${def.id} renders no h1`).toBeTruthy()
      unmount()
    }
  })

  it('keeps every hero rendering its default copy', () => {
    for (const def of sectionRegistry.getAll().filter((d) => d.category === 'hero')) {
      const inst = instanceOf(def.id)
      const { container, unmount } = renderPublic(inst)
      const text = container.textContent ?? ''
      // Each hero's headline (or its first headline line) must reach the DOM.
      const expected =
        (inst.props.headline as string | undefined) ??
        ((inst.props.lines as { text?: string }[] | undefined)?.[0]?.text ?? '')
      expect(text, `${def.id} rendered nothing recognisable`).toContain(expected)
      unmount()
    }
  })

  it('emits a stable host id for every slot', () => {
    const def = sectionRegistry.get('hero-momentum')!
    const { container } = renderPublic(instanceOf('hero-momentum'))

    for (const slot of def.slots ?? []) {
      expect(
        container.querySelector(`[data-slot-id="${slot.id}"]`),
        `slot "${slot.id}" has no host`
      ).toBeTruthy()
    }
  })
})

describe('per-instance structure', () => {
  it('honours a stored order', () => {
    const { container } = renderPublic(
      instanceOf('hero-momentum', {
        slots: {
          copy: { order: ['block:note', 'block:headline', 'block:badge'] },
        },
      })
    )

    const html = container.innerHTML
    expect(html.indexOf('No credit card required.')).toBeLessThan(
      html.indexOf('Ship your next idea')
    )
    expect(html.indexOf('Ship your next idea')).toBeLessThan(html.indexOf('New release'))
  })

  it('omits a hidden block from the DOM', () => {
    const { container } = renderPublic(
      instanceOf('hero-momentum', { slots: { copy: { hidden: ['badge'] } } })
    )

    expect(container.textContent).not.toContain('New release')
    // The rest of the section is untouched.
    expect(container.textContent).toContain('Ship your next idea')
  })

  it('renders a dropped element inside its slot, not below the section', () => {
    // This is the bug the whole feature exists to fix: an element dropped on a
    // hero used to land in the section's componentTree, which renders after the
    // JSX rather than where the user aimed.
    const dropped: ComponentNode = {
      id: 'n1',
      type: 'text',
      props: { text: 'Dropped inline' },
      children: [],
    }
    useBuilderStore.setState({
      injectedChildren: { [slotHostElementId('inst1', 'copy')]: [dropped] },
    })

    const { container } = renderPublic(
      instanceOf('hero-momentum', {
        slots: { copy: { order: ['block:badge', 'node:n1', 'block:headline'] } },
      })
    )

    const host = container.querySelector<HTMLElement>('[data-slot-id="copy"]')!
    expect(host.textContent).toContain('Dropped inline')

    const html = host.innerHTML
    expect(html.indexOf('New release')).toBeLessThan(html.indexOf('Dropped inline'))
    expect(html.indexOf('Dropped inline')).toBeLessThan(html.indexOf('Ship your next idea'))
  })

  it('ignores an order naming blocks from another slot', () => {
    const { container } = renderPublic(
      instanceOf('hero-momentum', {
        // `imageUrl` belongs to `media`; naming it here must not move it.
        slots: { copy: { order: ['block:imageUrl', 'block:headline'] } },
      })
    )

    const copy = container.querySelector<HTMLElement>('[data-slot-id="copy"]')!
    expect(copy.querySelector('img')).toBeNull()
    expect(container.querySelector('[data-slot-id="media"] img')).toBeTruthy()
  })
})

describe('the builder render path', () => {
  /** No public-site context ⇒ the builder branch, with every dnd-kit hook live. */
  function renderInBuilder (instance: SectionInstance) {
    const Component = sectionRegistry.get(instance.sectionId)!.Component
    return render(
      <BuilderDndProvider projectId="p1" websiteId="w1">
        <Component instance={instance} />
      </BuilderDndProvider>
    )
  }

  // One test per section: a failure names the section, and one broken section
  // can't hide the rest of the catalog behind it.
  const slottedIds = sectionRegistry
    .getAllIncludingHidden()
    .filter((d) => d.slots?.length)
    .map((d) => d.id)

  it.each(slottedIds)('mounts %s with its drag surfaces attached', (id) => {
    {
      const def = sectionRegistry.get(id)!
      const { container, unmount } = renderInBuilder(instanceOf(def.id))

      for (const slot of def.slots ?? []) {
        const host = container.querySelector<HTMLElement>(`[data-slot-id="${slot.id}"]`)
        expect(host, `${def.id}: slot "${slot.id}" did not render`).toBeTruthy()
        // The host doubles as the injectedChildren key, so it must carry it.
        expect(host!.getAttribute('data-element-id')).toBe(
          slotHostElementId('inst1', slot.id)
        )
        expect(host!.getAttribute('data-element-container')).toBe('1')
      }

      // Schema blocks are sortable entries on the canvas.
      expect(
        container.querySelectorAll('[data-slot-block]').length,
        `${def.id} exposed no draggable blocks`
      ).toBeGreaterThan(0)

      unmount()
    }
  })
})

describe('every slot-driven section', () => {
  // Catalog-wide: a section that adopts slots is covered here with no test edits.
  const slottedIds = sectionRegistry
    .getAllIncludingHidden()
    .filter((d) => d.slots?.length)
    .map((d) => d.id)

  it.each(slottedIds)('%s renders a host for every slot on the published path', (id) => {
    const def = sectionRegistry.get(id)!
    const { container, unmount } = renderPublic(instanceOf(id))
    for (const slot of def.slots ?? []) {
      expect(
        container.querySelector(`[data-slot-id="${slot.id}"]`),
        `${id}: slot "${slot.id}" has no host`
      ).toBeTruthy()
    }
    expect(
      (container.textContent ?? '').trim().length + container.querySelectorAll('img').length,
      `${id} rendered nothing`
    ).toBeGreaterThan(0)
    unmount()
  })

  // Stored instances can lack any prop; a block whose value is absent must
  // render nothing rather than throw.
  it.each(slottedIds)('%s renders with an empty props bag', (id) => {
    const { unmount } = renderPublic(instanceOf(id, { props: {} }))
    unmount()
  })
})

describe('CTA sections', () => {
  const ctas = () => sectionRegistry.getAll().filter((d) => d.category === 'cta')

  it('renders every CTA\'s default copy', () => {
    for (const def of ctas()) {
      const { container, unmount } = renderPublic(instanceOf(def.id))
      const expected = String(def.defaultProps.headline ?? def.defaultProps.title)
      expect(container.querySelector('h2')?.textContent, `${def.id} headline`).toContain(expected)
      unmount()
    }
  })

  // Pages saved before the slot migration store exactly these props. They must
  // render the same content they always did — nothing more, nothing less.
  it('keeps a pre-migration Whisper as a lone headline', () => {
    const { container } = renderPublic(
      instanceOf('cta-minimal', { props: { title: 'Try it today' } })
    )
    expect(container.querySelector('h2')?.textContent).toBe('Try it today')
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('keeps a pre-migration Ribbon\'s flat action', () => {
    const { container } = renderPublic(
      instanceOf('cta-banner', {
        props: { headline: 'Ship it', description: 'Today.', primaryLabel: 'Go', primaryHref: '/go' },
      })
    )
    const link = container.querySelector('a')!
    expect(link.textContent).toContain('Go')
    expect(link.getAttribute('href')).toBe('/go')
    // The href block is an inspector field, never visible text.
    expect(container.textContent).not.toContain('/go')
  })

  it('keeps a pre-migration Ledger\'s hardcoded card copy', () => {
    const { container } = renderPublic(
      instanceOf('cta-split', {
        props: {
          headline: 'Start now',
          description: 'Fast.',
          emailPlaceholder: 'Email',
          buttons: [{ label: 'Join', href: '#' }],
        },
      })
    )
    const text = container.textContent ?? ''
    expect(text).toContain('Create your free account')
    expect(text).toContain('No credit card required.')
    expect(text).toContain('Email')
  })

  it('lets Strip reorder its field and button independently', () => {
    const { container } = renderPublic(
      instanceOf('cta-inline', {
        slots: { row: { order: ['block:submitLabel', 'block:emailPlaceholder', 'block:headline'] } },
      })
    )
    const html = container.innerHTML
    const button = html.indexOf(String(sectionRegistry.get('cta-inline')!.defaultProps.submitLabel))
    const field = html.indexOf('Enter your email')
    const heading = html.indexOf('<h2')
    expect(button).toBeLessThan(field)
    expect(field).toBeLessThan(heading)
  })
})

describe('section-specific overrides', () => {
  it('lets Signal draw two note blocks as one form', () => {
    const { container } = renderPublic(instanceOf('hero-signal'))

    const form = container.querySelector('form')
    expect(form).toBeTruthy()
    expect(form!.querySelector('input')?.getAttribute('placeholder')).toBe('you@company.com')
    expect(form!.textContent).toContain('Join the waitlist')
    // The placeholder block renders nothing of its own.
    expect(container.querySelectorAll('input')).toHaveLength(1)
  })

  it('lets Forge build its headline from a collection', () => {
    const { container } = renderPublic(instanceOf('hero-forge'))

    const h1 = container.querySelector('h1')!
    expect(h1.textContent).toContain('Stronger')
    expect(h1.textContent).toContain('session')
  })

  it('keeps Atlas\'s media as a full-bleed background layer', () => {
    const { container } = renderPublic(instanceOf('hero-atlas'))

    const background = container.querySelector('[data-slot-id="background"]')
    expect(background).toBeTruthy()
    expect(background!.querySelector('img')).toBeTruthy()
  })
})
