'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, Zap, Heart, ArrowUpDown, ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/commissions'

// ==========================================
// CATEGORY CONFIG
// ==========================================
// Category display helpers
const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-cc-surface-container-high text-cc-text-secondary',
  electronics: 'bg-cc-blue/15 text-cc-blue',
  fashion: 'bg-cc-orange/15 text-cc-orange',
  phone: 'bg-cc-blue/15 text-cc-blue',
  food: 'bg-cc-yellow/15 text-cc-yellow',
  beauty: 'bg-cc-orange/15 text-cc-orange',
  home: 'bg-cc-yellow/15 text-cc-yellow',
  other: 'bg-white/10 text-cc-text-secondary',
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Général',
  electronics: 'Électronique',
  fashion: 'Mode',
  phone: 'Téléphone',
  food: 'Alimentation',
  beauty: 'Beauté',
  home: 'Maison',
  other: 'Autre',
}

const ALL_CATEGORIES = ['all', 'electronics', 'fashion', 'phone', 'food', 'beauty', 'home', 'other']

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name'

// ==========================================
// COUNTDOWN TIMER
// ==========================================
function CountdownTimer({ targetDate, compact = false }: { targetDate: string | Date; compact?: boolean }) {
  const calculateTimeLeft = () => {
    const difference = new Date(targetDate).getTime() - new Date().getTime()
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    }
  }

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft())

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.expired) return null

  const pad = (n: number) => n.toString().padStart(2, '0')
  const units = timeLeft.days > 0
    ? [{ value: String(timeLeft.days), label: 'j' }, { value: pad(timeLeft.hours), label: 'h' }, { value: pad(timeLeft.minutes), label: 'm' }]
    : [{ value: pad(timeLeft.hours), label: 'h' }, { value: pad(timeLeft.minutes), label: 'm' }, { value: pad(timeLeft.seconds), label: 's' }]

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {units.map((unit, i) => (
          <React.Fragment key={unit.label}>
            {i > 0 && <span className="text-cc-orange/50 text-[9px]">:</span>}
            <span className="bg-cc-orange/15 text-cc-orange text-[10px] font-bold px-1 py-0.5 rounded min-w-[20px] text-center inline-block">
              {unit.value}{unit.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        {units.map((unit, i) => (
          <React.Fragment key={unit.label}>
            {i > 0 && <span className="text-cc-orange/50 text-xs">:</span>}
            <span className="bg-cc-orange/15 text-cc-orange text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[26px] text-center inline-block">
              {unit.value}{unit.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// FLASH CATALOG OVERLAY
// ==========================================
interface FlashCatalogOverlayProps {
  onClose: () => void
  onBuyProduct: (product: any) => void
}

export function FlashCatalogOverlay({ onClose, onBuyProduct }: FlashCatalogOverlayProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('cc_liked_products')
      if (stored) return new Set(JSON.parse(stored))
    } catch {}
    return new Set()
  })

  useEffect(() => {
    fetch('/api/flash-products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const toggleLike = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isLiked = likedProducts.has(productId)
    const newLiked = new Set(likedProducts)
    if (isLiked) newLiked.delete(productId)
    else newLiked.add(productId)
    setLikedProducts(newLiked)
    localStorage.setItem('cc_liked_products', JSON.stringify([...newLiked]))
    try {
      await fetch('/api/flash-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, like: !isLiked }),
      })
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, likes: Math.max(0, (p.likes || 0) + (isLiked ? -1 : 1)) } : p
      ))
    } catch {}
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory)
    }

    // Search filter (name, description, price)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        formatCurrency(p.price).toLowerCase().includes(q) ||
        CATEGORY_LABELS[p.category]?.toLowerCase().includes(q)
      )
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'))
        break
    }

    return result
  }, [products, selectedCategory, searchQuery, sortBy])

  // Available categories from products
  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return ALL_CATEGORIES.filter(c => c === 'all' || cats.has(c))
  }, [products])

  const sortLabels: Record<SortOption, string> = {
    default: 'Par défaut',
    'price-asc': 'Prix croissant',
    'price-desc': 'Prix décroissant',
    name: 'Nom A-Z',
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-cc-page-bg overflow-y-auto"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header - sticky */}
      <div className="sticky top-0 z-10 bg-cc-page-bg/95 backdrop-blur-xl border-b border-cc-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cc-orange" />
              <h1 className="text-lg font-black text-cc-text-primary">Vente Flash</h1>
              <Badge className="bg-cc-orange/10 text-cc-orange border-cc-orange/20 text-[10px]">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-cc-surface-container border border-cc-border flex items-center justify-center hover:bg-cc-surface-container-high transition-colors"
            >
              <X className="w-4 h-4 text-cc-text-secondary" />
            </button>
          </div>

          {/* Search bar */}
          <div className="pb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cc-text-secondary/50" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, prix..."
                className="pl-9 h-10 bg-cc-surface-container border-cc-border rounded-xl text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-cc-text-secondary/50 hover:text-cc-text-secondary" />
                </button>
              )}
            </div>
            {/* Sort button */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  sortBy !== 'default'
                    ? 'bg-cc-orange/10 border-cc-orange/20 text-cc-orange'
                    : 'bg-cc-surface-container border-cc-border text-cc-text-secondary hover:text-cc-text-primary'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trier</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-cc-surface-container border border-cc-border rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    {(Object.keys(sortLabels) as SortOption[]).map(option => (
                      <button
                        key={option}
                        onClick={() => { setSortBy(option); setShowSortMenu(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortBy === option
                            ? 'bg-cc-orange/10 text-cc-orange font-medium'
                            : 'text-cc-text-secondary hover:bg-cc-surface-container-high hover:text-cc-text-primary'
                        }`}
                      >
                        {sortLabels[option]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Category filters - horizontal scroll */}
          <div className="pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {availableCategories.map(cat => {
              const isActive = selectedCategory === cat
              const isAll = cat === 'all'
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isActive
                      ? 'bg-cc-orange/15 border-cc-orange/30 text-cc-orange'
                      : 'bg-cc-surface-container border-cc-border text-cc-text-secondary hover:text-cc-text-primary hover:border-cc-text-secondary/30'
                  }`}
                >
                  {isAll ? 'Tous' : CATEGORY_LABELS[cat] || cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-cc-surface-container animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-bold text-cc-text-primary mb-2">Aucun produit trouvé</h3>
            <p className="text-sm text-cc-text-secondary mb-4">
              {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun produit dans cette catégorie'}
            </p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSortBy('default') }}
              className="border-cc-border"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product, index) => {
              const images = product.images ? product.images.split(',').filter((img: string) => img.trim()) : []
              const mainImage = images[0]?.trim() || null
              const hasDiscount = product.originalPrice > product.price
              const discountPercent = hasDiscount
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.4) }}
                  className="group"
                >
                  <Card className="bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden h-full flex flex-col">
                    {/* Image */}
                    <div className="relative w-full min-h-[140px] sm:min-h-[180px] flex items-center justify-center overflow-hidden">
                      {mainImage && (
                        <img src={mainImage} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" />
                      )}
                      <div className="absolute inset-0 bg-cc-surface-container/60" />

                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="relative z-10 max-h-[160px] sm:max-h-[180px] max-w-[85%] object-contain object-center drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full min-h-[140px] flex items-center justify-center">
                        </div>
                      )}

                      {/* Category badge */}
                      {product.category && product.category !== 'general' && (
                        <div className="absolute top-2 left-2 z-20">
                          <Badge className={`${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.other} text-[9px] font-bold shadow-lg backdrop-blur-md border border-white/10`}>
                            {CATEGORY_LABELS[product.category] || product.category}
                          </Badge>
                        </div>
                      )}

                      {/* Discount badge */}
                      {hasDiscount && (
                        <div className="absolute top-2 right-2 z-20">
                          <Badge className="bg-cc-orange text-white text-[9px] font-bold shadow-lg border-0">
                            -{discountPercent}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Price & Countdown */}
                    <div className="px-3 pt-2 pb-0.5 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-cc-text-primary text-sm sm:text-base">{formatCurrency(product.price)}</span>
                        {hasDiscount && (
                          <span className="text-xs text-cc-text-secondary/60 line-through">{formatCurrency(product.originalPrice)}</span>
                        )}
                      </div>
                      {product.saleEndsAt && new Date(product.saleEndsAt) > new Date() && (
                        <CountdownTimer targetDate={product.saleEndsAt} compact />
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 pb-3 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-cc-text-primary text-xs sm:text-sm mb-1 line-clamp-1 flex-1">{product.name}</h3>
                        <button
                          onClick={(e) => toggleLike(product.id, e)}
                          className="shrink-0 p-0.5 hover:scale-110 transition-transform"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              likedProducts.has(product.id) ? 'fill-cc-orange text-cc-orange' : 'text-cc-text-secondary/40 hover:text-cc-orange'
                            }`}
                          />
                        </button>
                      </div>

                      {product.description && (
                        <p className="text-[11px] sm:text-xs text-cc-text-secondary mb-2 flex-1 line-clamp-2">{product.description}</p>
                      )}

                      <Button
                        className="w-full bg-cc-orange text-white h-9 btn-glow-orange font-bold text-xs sm:text-sm rounded-xl group-hover:shadow-lg transition-all duration-300 mt-auto"
                        onClick={() => onBuyProduct(product)}
                      >
                        Acheter
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
