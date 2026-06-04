'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { ProductGrid } from '@/components/product/ProductGrid'
import type { Product } from '@/types'

type SortMode = 'newest' | 'price_asc' | 'price_desc'

function sortLabel(mode: SortMode) {
  switch (mode) {
    case 'newest':
      return 'Newest'
    case 'price_asc':
      return 'Price: Low → High'
    case 'price_desc':
      return 'Price: High → Low'
  }
}

function compareCreatedAtDesc(a: Product, b: Product) {
  // ISO timestamps compare lexicographically, but parse for safety.
  const at = Date.parse(a.created_at)
  const bt = Date.parse(b.created_at)
  if (Number.isNaN(at) || Number.isNaN(bt)) return 0
  return bt - at
}

function sortProducts(initialProducts: Product[], mode: SortMode) {
  if (mode === 'newest') return initialProducts

  const dir = mode === 'price_asc' ? 1 : -1
  return [...initialProducts].sort((a, b) => {
    const diff = a.price_cents - b.price_cents
    if (diff !== 0) return diff * dir
    return compareCreatedAtDesc(a, b)
  })
}

export function ProductCatalog({ initialProducts }: { initialProducts: Product[] }) {
  const dialogTitleId = useId()
  const radioName = useMemo(() => `sort-${dialogTitleId}`, [dialogTitleId])

  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [draftSortMode, setDraftSortMode] = useState<SortMode>('newest')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!isModalOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsModalOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen])

  const products = useMemo(() => {
    if (sortMode === 'newest') return initialProducts
    return sortProducts(initialProducts, sortMode)
  }, [initialProducts, sortMode])

  const currentLabel = sortLabel(sortMode)

  function openModal() {
    setDraftSortMode(sortMode)
    setIsModalOpen(true)
  }

  function applyDraft() {
    setSortMode(draftSortMode)
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-bold text-gray-800">Our Collection</h2>
        <p className="text-gray-500 mt-2">Browse handmade pieces, each crafted just for you</p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 transition-colors"
          aria-label={`Sort products (currently ${currentLabel})`}
        >
          <ArrowUpDown size={16} />
          Sort by
        </button>
        <p className="text-sm text-gray-500">
          Current: {currentLabel}
        </p>
      </div>

      <ProductGrid products={products} />

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close modal"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-pink-100 p-5">
            <h3 id={dialogTitleId} className="font-display text-xl font-bold text-gray-800">
              Sort products
            </h3>
            <p className="text-sm text-gray-500 mt-1">Choose how to order items in the catalog.</p>

            <fieldset className="mt-5 space-y-3">
              <legend className="sr-only">Sort mode</legend>

              {(['newest', 'price_asc', 'price_desc'] as const).map(mode => (
                <label
                  key={mode}
                  className="flex items-start gap-3 rounded-xl border border-pink-100 p-3 hover:bg-pink-50 transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={mode}
                    checked={draftSortMode === mode}
                    onChange={() => setDraftSortMode(mode)}
                    className="mt-1 accent-pink-400"
                  />
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-800">{sortLabel(mode)}</p>
                    {mode === 'newest' && (
                      <p className="text-xs text-gray-500">Default ordering (most recently added first).</p>
                    )}
                    {mode === 'price_asc' && (
                      <p className="text-xs text-gray-500">Cheapest items first.</p>
                    )}
                    {mode === 'price_desc' && (
                      <p className="text-xs text-gray-500">Most expensive items first.</p>
                    )}
                  </div>
                </label>
              ))}
            </fieldset>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-pink-200 px-5 py-2 text-sm font-medium text-gray-800 hover:bg-pink-300 transition-colors"
                onClick={applyDraft}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

