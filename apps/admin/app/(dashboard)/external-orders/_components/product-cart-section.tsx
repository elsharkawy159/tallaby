'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import {
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { cn } from '@workspace/ui/lib/utils'
import { formatPricePlain } from '@workspace/lib'
import { getPublicUrl } from '@/lib/utils'
import { searchProductsForExternalOrder } from '@/actions/external-orders'
import type { ExternalOrderCartLine } from '../external-orders.types'

interface SearchVariant {
  id: string
  label: string
  price: number
  stock: number
  sku: string | null
  imageUrl: string | null
}

interface SearchProduct {
  id: string
  title: string
  titleAr: string | null
  sku: string | null
  price: number
  image: string | null
  stock: number | string | null
  variants: SearchVariant[]
}

interface ProductCartSectionProps {
  lines: ExternalOrderCartLine[]
  onLinesChange: (lines: ExternalOrderCartLine[]) => void
}

function resolveProductImage(
  storagePath: string | null | undefined,
): string | null {
  if (!storagePath) return null
  if (
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('/')
  ) {
    return storagePath
  }
  return getPublicUrl(storagePath, 'products')
}

function StockBadge({ stock }: { stock: number | string | null }) {
  if (stock == null) return null
  const count = Number(stock)
  if (!Number.isFinite(count)) return null
  return (
    <Badge
      variant={count > 0 ? 'outline' : 'destructive'}
      className="font-normal"
    >
      {count > 0 ? `${count} in stock` : 'Out of stock'}
    </Badge>
  )
}

export function ProductCartSection({
  lines,
  onLinesChange,
}: ProductCartSectionProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [searchedQuery, setSearchedQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(0)
  // Price fields keep their own text while being typed, so backspacing to an
  // empty box does not immediately snap the value back.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})
  const [isSearching, startSearch] = useTransition()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const latestQueryRef = useRef('')

  const runSearch = useCallback((value: string) => {
    latestQueryRef.current = value
    if (value.trim().length < 2) {
      setResults([])
      setSearchedQuery('')
      return
    }
    startSearch(async () => {
      const res = await searchProductsForExternalOrder(value)
      // Ignore responses that arrive after the admin kept typing.
      if (latestQueryRef.current !== value) return
      if (res.success && res.data) {
        setResults(res.data)
        setSearchedQuery(value)
        setHighlight(0)
        setExpandedId(null)
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 250)
    return () => clearTimeout(timer)
  }, [query, runSearch])

  const quantityInCart = (productId: string, variantId?: string) =>
    lines
      .filter(
        (l) =>
          l.productId === productId &&
          (variantId === undefined || l.variantId === variantId),
      )
      .reduce((sum, l) => sum + l.quantity, 0)

  const addToCart = (product: SearchProduct, variant?: SearchVariant) => {
    const unitPrice = variant?.price ?? product.price
    const key = `${product.id}:${variant?.id ?? 'base'}`
    const imageUrl = resolveProductImage(variant?.imageUrl ?? product.image)

    const existing = lines.find((l) => l.key === key)
    if (existing) {
      onLinesChange(
        lines.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + 1 } : l,
        ),
      )
    } else {
      onLinesChange([
        ...lines,
        {
          key,
          productId: product.id,
          variantId: variant?.id,
          quantity: 1,
          title: product.title,
          variantLabel: variant?.label,
          unitPrice,
          catalogPrice: unitPrice,
          image: imageUrl,
        },
      ])
    }
  }

  const activateProduct = (product: SearchProduct) => {
    if (product.variants.length > 0) {
      setExpandedId((id) => (id === product.id ? null : product.id))
      return
    }
    addToCart(product)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSearchedQuery('')
    setExpandedId(null)
    searchInputRef.current?.focus()
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault()
      setHighlight((i) => Math.min(results.length - 1, i + 1))
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault()
      setHighlight((i) => Math.max(0, i - 1))
    } else if (event.key === 'Enter') {
      // Never submit the order form from the search box.
      event.preventDefault()
      const product = results[highlight]
      if (product) activateProduct(product)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      clearSearch()
    }
  }

  const setQuantity = (key: string, quantity: number) => {
    onLinesChange(
      lines.map((l) =>
        l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l,
      ),
    )
  }

  const updateQty = (key: string, delta: number) => {
    const line = lines.find((l) => l.key === key)
    if (line) setQuantity(key, line.quantity + delta)
  }

  const removeLine = (key: string) => {
    onLinesChange(lines.filter((l) => l.key !== key))
  }

  const setLinePrice = (key: string, unitPrice: number) => {
    onLinesChange(
      lines.map((l) => (l.key === key ? { ...l, unitPrice } : l)),
    )
  }

  const handlePriceChange = (key: string, raw: string) => {
    setPriceDrafts((drafts) => ({ ...drafts, [key]: raw }))

    const parsed = Number(raw)
    if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) {
      setLinePrice(key, parsed)
    }
  }

  const clearPriceDraft = (key: string) => {
    setPriceDrafts((drafts) => {
      const next = { ...drafts }
      delete next[key]
      return next
    })
  }

  /** A field left blank or invalid falls back to the catalogue price. */
  const handlePriceBlur = (key: string) => {
    const draft = priceDrafts[key]
    const parsed = Number(draft)
    if (
      draft != null &&
      (draft.trim() === '' || !Number.isFinite(parsed) || parsed < 0)
    ) {
      const line = lines.find((l) => l.key === key)
      if (line) setLinePrice(key, line.catalogPrice)
    }
    clearPriceDraft(key)
  }

  const resetPrice = (key: string) => {
    clearPriceDraft(key)
    const line = lines.find((l) => l.key === key)
    if (line) setLinePrice(key, line.catalogPrice)
  }

  const showNoResults =
    !isSearching &&
    searchedQuery.length >= 2 &&
    searchedQuery === query &&
    results.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Products</CardTitle>
        <CardDescription>
          Search in English or Arabic, by any word of the name, or by SKU.
          Click a product (or press Enter) to add it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            className="pl-9 pr-9"
            dir="auto"
            placeholder="e.g. power bank, باور بانك, anker 20000, SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {showNoResults && (
          <p className="text-sm text-muted-foreground">
            No products match &ldquo;{searchedQuery}&rdquo;.
          </p>
        )}

        {results.length > 0 && (
          <ul className="max-h-[26rem] divide-y overflow-y-auto rounded-lg border">
            {results.map((product, index) => {
              const inCart = quantityInCart(product.id)
              const isExpanded = expandedId === product.id
              const image = resolveProductImage(product.image)

              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlight(index)
                      activateProduct(product)
                    }}
                    onMouseEnter={() => setHighlight(index)}
                    className={cn(
                      'flex w-full items-center gap-3 p-2.5 text-left transition-colors',
                      index === highlight && 'bg-muted/60',
                    )}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                      {image ? (
                        <Image
                          src={image}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.title}
                      </p>
                      {product.titleAr && (
                        <p
                          dir="rtl"
                          className="truncate text-right text-xs text-muted-foreground"
                        >
                          {product.titleAr}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {product.sku && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {product.sku}
                          </span>
                        )}
                        {product.variants.length > 0 ? (
                          <Badge variant="secondary" className="font-normal">
                            {product.variants.length} variants
                          </Badge>
                        ) : (
                          <StockBadge stock={product.stock} />
                        )}
                        {inCart > 0 && (
                          <Badge className="font-normal">In cart ×{inCart}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatPricePlain(product.price, 'en')} EGP
                      </span>
                      {product.variants.length > 0 ? (
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      ) : (
                        <Plus className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="grid gap-2 bg-muted/30 p-2.5 sm:grid-cols-2">
                      {product.variants.map((variant) => {
                        const variantInCart = quantityInCart(
                          product.id,
                          variant.id,
                        )
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => addToCart(product, variant)}
                            className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm hover:border-primary"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {variant.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {variant.stock > 0
                                  ? `${variant.stock} in stock`
                                  : 'Out of stock'}
                                {variantInCart > 0 && ` · in cart ×${variantInCart}`}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1 font-semibold">
                              {formatPricePlain(variant.price, 'en')}
                              <Plus className="h-4 w-4 text-primary" />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products added yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {lines.map((line) => (
              <li
                key={line.key}
                className="flex items-center gap-3 p-3"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {line.image ? (
                    <Image
                      src={line.image}
                      alt={line.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.title}</p>
                  {line.variantLabel && (
                    <p className="truncate text-xs text-muted-foreground">
                      {line.variantLabel}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <label className="text-xs text-muted-foreground">
                      Unit price
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-8 w-28"
                      value={priceDrafts[line.key] ?? String(line.unitPrice)}
                      onChange={(e) =>
                        handlePriceChange(line.key, e.target.value)
                      }
                      onBlur={() => handlePriceBlur(line.key)}
                    />
                    <span className="text-xs text-muted-foreground">EGP</span>
                    {line.unitPrice !== line.catalogPrice && (
                      <button
                        type="button"
                        onClick={() => resetPrice(line.key)}
                        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Reset to {formatPricePlain(line.catalogPrice, 'en')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQty(line.key, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 w-14 px-1 text-center"
                    value={line.quantity}
                    onChange={(e) =>
                      setQuantity(line.key, Math.floor(Number(e.target.value)) || 1)
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQty(line.key, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="w-24 text-right text-sm font-medium">
                  {formatPricePlain(line.unitPrice * line.quantity, 'en')} EGP
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(line.key)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
