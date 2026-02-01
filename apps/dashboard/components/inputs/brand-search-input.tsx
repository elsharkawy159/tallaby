'use client'

import * as React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Check, ChevronsUpDown, LoaderCircle, Plus } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@workspace/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/command'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { searchBrands, createBrand } from '@/actions/brands'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'sonner'

export interface BrandOption {
  id: string
  name: string
  slug: string
}

interface BrandSearchInputProps {
  name: string
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  selectedBrands?: BrandOption[]
}

export function BrandSearchInput({
  name,
  label = 'Brand',
  placeholder = 'Search for a brand...',
  disabled = false,
  className,
  selectedBrands = [],
}: BrandSearchInputProps) {
  const form = useFormContext()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<BrandOption[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [cachedSelected, setCachedSelected] = React.useState<BrandOption | null>(null)
  const debouncedQuery = useDebounce(query, 300)

  const searchBrandsEffect = React.useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await searchBrands(q)
      if (res.success && res.data) {
        setResults(res.data as BrandOption[])
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  React.useEffect(() => {
    searchBrandsEffect(debouncedQuery)
  }, [debouncedQuery, searchBrandsEffect])

  const selectedId = form.watch(name)
  const selectedBrand = React.useMemo(() => {
    if (!selectedId) return null
    if (cachedSelected?.id === selectedId) return cachedSelected
    const fromResults = results.find((b) => b.id === selectedId)
    if (fromResults) return fromResults
    const fromInitial = selectedBrands.find((b) => b.id === selectedId)
    return fromInitial || null
  }, [selectedId, cachedSelected, results, selectedBrands])

  React.useEffect(() => {
    if (!selectedId) setCachedSelected(null)
  }, [selectedId])

  const handleSelect = (brand: BrandOption) => {
    setCachedSelected(brand)
    form.setValue(name, brand.id, { shouldDirty: true, shouldValidate: true })
    setOpen(false)
    setQuery('')
  }

  const handleAddNew = async () => {
    const nameToAdd = query.trim()
    if (!nameToAdd) return

    setIsCreating(true)
    try {
      const res = await createBrand(nameToAdd)
      if (res.success && res.data) {
        const newBrand = res.data as BrandOption
        setCachedSelected(newBrand)
        form.setValue(name, newBrand.id, { shouldDirty: true, shouldValidate: true })
        setOpen(false)
        setQuery('')
        toast.success(`Brand "${newBrand.name}" created and selected`)
      } else {
        toast.error(res.error || 'Failed to create brand')
      }
    } catch {
      toast.error('Failed to create brand')
    } finally {
      setIsCreating(false)
    }
  }

  const showAddButton =
    debouncedQuery.length >= 2 &&
    !isSearching &&
    results.length === 0 &&
    debouncedQuery.trim().length > 0

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className={className}>
          {label && <FormLabel className="text-sm">{label}</FormLabel>}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    'justify-between gap-2 pl-3 w-full truncate rounded-lg bg-white h-11.5 hover:bg-gray-50 transition-colors text-gray-800 font-medium',
                    !selectedBrand && 'text-muted-foreground'
                  )}
                >
                  <span className="truncate">
                    {selectedBrand ? selectedBrand.name : placeholder}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search by brand name..."
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList>
                  {isSearching && (
                    <div className="flex items-center justify-center py-6">
                      <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!isSearching && query.length < 2 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Type at least 2 characters to search
                    </div>
                  )}
                  {!isSearching && query.length >= 2 && results.length === 0 && !showAddButton && (
                    <CommandEmpty>No brands found.</CommandEmpty>
                  )}
                  {!isSearching &&
                    results.map((brand) => (
                      <CommandItem
                        key={brand.id}
                        value={brand.id}
                        onSelect={() => handleSelect(brand)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedId === brand.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {brand.name}
                      </CommandItem>
                    ))}
                  {showAddButton && (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleAddNew}
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add &quot;{query.trim()}&quot; as new brand
                      </Button>
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
