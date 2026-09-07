import { describe, expect, it } from 'vitest'
import { buildPinterestAdDescription } from './pinterest-ad-share.lib'

describe('buildPinterestAdDescription', () => {
  const productUrl = 'https://www.tallaby.com/products/wireless-earbuds'

  it('builds CTA + bullets + product URL', () => {
    const result = buildPinterestAdDescription({
      adTitle: 'Shop now — Wireless Earbuds',
      bulletPoints: ['Noise cancelling', '24h battery', 'Water resistant'],
      description: 'Should be ignored when bullets exist',
      productUrl,
    })

    expect(result).toBe(
      [
        'Shop now — Wireless Earbuds',
        '',
        '• Noise cancelling',
        '• 24h battery',
        '• Water resistant',
        '',
        productUrl,
      ].join('\n')
    )
  })

  it('falls back to a short description when bullets are missing', () => {
    const result = buildPinterestAdDescription({
      adTitle: 'Shop now — Ceramic Mug',
      description: 'A durable ceramic mug for everyday coffee.',
      productUrl,
    })

    expect(result).toContain('Shop now — Ceramic Mug')
    expect(result).toContain('A durable ceramic mug for everyday coffee.')
    expect(result).toContain(productUrl)
    expect(result).not.toContain('•')
  })

  it('uses at most three bullets', () => {
    const result = buildPinterestAdDescription({
      adTitle: 'Shop now — Bag',
      bulletPoints: ['One', 'Two', 'Three', 'Four'],
      productUrl,
    })

    expect(result).toContain('• One')
    expect(result).toContain('• Three')
    expect(result).not.toContain('• Four')
  })

  it('truncates long descriptions while keeping the product URL intact', () => {
    const longDescription = 'x'.repeat(400)
    const result = buildPinterestAdDescription({
      adTitle: 'Shop now — Long Product',
      description: longDescription,
      productUrl,
    })

    expect(result.length).toBeLessThanOrEqual(500)
    expect(result.endsWith(productUrl)).toBe(true)
  })

  it('returns CTA alone when there is no body or URL', () => {
    expect(
      buildPinterestAdDescription({
        adTitle: 'Shop now — Empty',
        productUrl: '',
      })
    ).toBe('Shop now — Empty')
  })
})
