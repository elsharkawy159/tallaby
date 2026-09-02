'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { Search, Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { formatPricePlain } from '@workspace/lib'
import { getPublicUrl } from '@/lib/utils'
import { searchProductsForExternalOrder } from '@/actions/external-orders'
import type { ExternalOrderCartLine } from '../external-orders.types'

interface SearchProduct {
  id: string
  title: string
  sku: string | null
  price: number
  image: string | null
  stock: number | string | null
  variants: Array<{
    id: string
    label: string
    price: number
    stock: number
    imageUrl: string | null
  }>
}

interface ProductCartSectionProps {
  lines: ExternalOrderCartLine[]
  onLinesChange: (lines: ExternalOrderCartLine[]) => void
}

function truncateTitle(title: string, max = 42): string {
  if (title.length <= max) return title
  return `${title.slice(0, max)}…`
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

export function ProductCartSection({
  lines,
  onLinesChange,
}: ProductCartSectionProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [addQty, setAddQty] = useState(1)
  const [isSearching, startSearch] = useTransition()

  const selectedProduct = results.find((p) => p.id === selectedProductId)

  const runSearch = useCallback((value: string) => {
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    startSearch(async () => {
      const res = await searchProductsForExternalOrder(value)
      if (res.success && res.data) {
        setResults(res.data)
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, runSearch])

  const handleAdd = () => {
    if (!selectedProduct) return

    const variant = selectedProduct.variants.find(
      (v) => v.id === selectedVariantId,
    )
    const hasVariants = selectedProduct.variants.length > 0

    if (hasVariants && !variant) return

    const unitPrice = variant?.price ?? selectedProduct.price
    const key = `${selectedProduct.id}:${variant?.id ?? 'base'}`
    const imagePath = variant?.imageUrl ?? selectedProduct.image
    const imageUrl = resolveProductImage(imagePath)

    const existing = lines.find((l) => l.key === key)
    if (existing) {
      onLinesChange(
        lines.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + addQty } : l,
        ),
      )
    } else {
      onLinesChange([
        ...lines,
        {
          key,
          productId: selectedProduct.id,
          variantId: variant?.id,
          quantity: addQty,
          title: selectedProduct.title,
          variantLabel: variant?.label,
          unitPrice,
          image: imageUrl,
        },
      ])
    }

    setAddQty(1)
    setSelectedVariantId('')
  }

  const updateQty = (key: string, delta: number) => {
    onLinesChange(
      lines
        .map((l) =>
          l.key === key
            ? { ...l, quantity: Math.max(1, l.quantity + delta) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }

  const removeLine = (key: string) => {
    onLinesChange(lines.filter((l) => l.key !== key))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Products</CardTitle>
        <CardDescription>Search and add products to the order.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {isSearching && (
          <p className="text-sm text-muted-foreground">Searching…</p>
        )}

        {results.length > 0 && (
          <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-2">
            <Select
              value={selectedProductId}
              onValueChange={(id) => {
                setSelectedProductId(id)
                setSelectedVariantId('')
              }}
            >
              <SelectTrigger className="max-w-full">
                <SelectValue placeholder="Select product">
                  {selectedProduct
                    ? truncateTitle(selectedProduct.title)
                    : 'Select product'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {results.map((p) => (
                  <SelectItem key={p.id} value={p.id} title={p.title}>
                    <span className="block max-w-[min(100vw-4rem,28rem)] truncate">
                      {truncateTitle(p.title)} —{' '}
                      {formatPricePlain(p.price, 'en')} EGP
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProduct && selectedProduct.variants.length > 0 && (
              <Select
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
              >
                <SelectTrigger className="max-w-full">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.variants.map((v) => (
                    <SelectItem key={v.id} value={v.id} title={v.label}>
                      <span className="block max-w-[min(100vw-4rem,28rem)] truncate">
                        {truncateTitle(v.label)} —{' '}
                        {formatPricePlain(v.price, 'en')} EGP
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                className="w-20"
                value={addQty}
                onChange={(e) =>
                  setAddQty(Math.max(1, Number(e.target.value) || 1))
                }
              />
              <Button type="button" onClick={handleAdd} disabled={!selectedProductId}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
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
                  <p className="text-sm text-muted-foreground">
                    {formatPricePlain(line.unitPrice, 'en')} EGP each
                  </p>
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
                  <span className="w-8 text-center text-sm">{line.quantity}</span>
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
