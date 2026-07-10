'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search,
  ArrowUpDown, ChevronDown,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/commissions'
import { OPERATOR_INFO } from '@/lib/constants'
import { PaymentOverlay } from '@/components/payment-overlay'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ==========================================
// OPERATOR CONFIG
// ==========================================
const OPERATOR_COLORS: Record<string, string> = {
  ORANGE: 'bg-cc-orange/15 text-cc-orange',
  MTN: 'bg-cc-yellow/15 text-cc-yellow',
  MOOV: 'bg-cc-blue/15 text-cc-blue',
  ALL: 'bg-cc-surface-container-high text-cc-text-secondary',
}

const OPERATOR_LABELS: Record<string, string> = {
  ORANGE: 'Orange',
  MTN: 'MTN',
  MOOV: 'Moov',
  ALL: 'Tous opérateurs',
}

const ALL_OPERATORS = ['all', 'ORANGE', 'MTN', 'MOOV', 'ALL']

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name'

// ==========================================
// PHYSICAL CATALOG OVERLAY
// ==========================================
interface PhysicalCatalogOverlayProps {
  onClose: () => void
}

export function PhysicalCatalogOverlay({ onClose }: PhysicalCatalogOverlayProps) {
  const [sections, setSections] = useState<any[]>([])
  const [unassignedCards, setUnassignedCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOperator, setSelectedOperator] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const { addToCart, setCartOpen } = useAppStore()

  useEffect(() => {
    fetch('/api/card-sections?withCards=true')
      .then(r => r.json())
      .then(data => { setSections(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/api/physical-cards')
      .then(r => r.json())
      .then(data => {
        const all = Array.isArray(data) ? data : []
        setUnassignedCards(all.filter((c: any) => !c.sectionId))
      })
      .catch(() => {})
  }, [])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Combine all cards
  const allCards = useMemo(() => {
    const cards: any[] = []
    sections.forEach((s: any) => {
      (s.cards || []).forEach((c: any) => {
        cards.push({ ...c, sectionTitle: s.title })
      })
    })
    unassignedCards.forEach((c: any) => {
      cards.push({ ...c, sectionTitle: 'Autres' })
    })
    return cards
  }, [sections, unassignedCards])

  // Filter and sort
  const filteredCards = useMemo(() => {
    let result = [...allCards]

    // Operator filter
    if (selectedOperator !== 'all') {
      result = result.filter(c => c.operator === selectedOperator)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        formatCurrency(c.price).toLowerCase().includes(q) ||
        OPERATOR_LABELS[c.operator]?.toLowerCase().includes(q) ||
        c.sectionTitle?.toLowerCase().includes(q)
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
  }, [allCards, selectedOperator, searchQuery, sortBy])

  // Available operators from cards
  const availableOperators = useMemo(() => {
    const ops = new Set(allCards.map(c => c.operator).filter(Boolean))
    return ALL_OPERATORS.filter(o => o === 'all' || ops.has(o))
  }, [allCards])

  const sortLabels: Record<SortOption, string> = {
    default: 'Par défaut',
    'price-asc': 'Prix croissant',
    'price-desc': 'Prix décroissant',
    name: 'Nom A-Z',
  }

  if (selectedCard) {
    return <PaymentOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
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
              <h1 className="text-lg font-black text-cc-text-primary">Cartes & Téléphones</h1>
              <Badge className="bg-cc-orange/10 text-cc-orange border-cc-orange/20 text-[10px]">
                {filteredCards.length} produit{filteredCards.length !== 1 ? 's' : ''}
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
                placeholder="Rechercher par nom, opérateur, prix..."
                className="pl-9 h-10 bg-cc-surface-container border-cc-border rounded-xl text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
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

          {/* Operator filters */}
          <div className="pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {availableOperators.map(op => {
              const isActive = selectedOperator === op
              const isAll = op === 'all'
              const opInfo = !isAll ? OPERATOR_INFO[op] : null
              return (
                <button
                  key={op}
                  onClick={() => setSelectedOperator(op)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cc-orange/15 border-cc-orange/30 text-cc-orange'
                      : 'bg-cc-surface-container border-cc-border text-cc-text-secondary hover:text-cc-text-primary hover:border-cc-text-secondary/30'
                  }`}
                >
                  {!isAll && opInfo && (
                    <span className={`w-2 h-2 rounded-full ${opInfo.bg}`} />
                  )}
                  {isAll ? 'Tous' : OPERATOR_LABELS[op] || op}
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
              <div key={i} className="h-56 rounded-2xl bg-cc-surface-container animate-pulse" />
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-bold text-cc-text-primary mb-2">Aucun produit trouvé</h3>
            <p className="text-sm text-cc-text-secondary mb-4">
              {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun produit pour cet opérateur'}
            </p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setSelectedOperator('all'); setSortBy('default') }}
              className="border-cc-border"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCards.map((card, index) => {
              const opInfo = OPERATOR_INFO[card.operator] || OPERATOR_INFO.ORANGE
              const opColor = OPERATOR_COLORS[card.operator] || OPERATOR_COLORS.ALL

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.4) }}
                  className="group"
                >
                  <Card className="bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-cc-surface-container-high">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cc-surface-container-high to-cc-surface-container">
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Operator badge */}
                      <Badge className={`absolute top-2 left-2 ${opInfo.bg} ${opInfo.color} text-[9px] font-bold tracking-wide shadow-lg`}>
                        {opInfo.name}
                      </Badge>
                      {/* Section badge */}
                      {card.sectionTitle && card.sectionTitle !== 'Autres' && (
                        <Badge className="absolute top-2 right-2 bg-white/10 backdrop-blur-md text-white text-[8px] font-bold border border-white/10">
                          {card.sectionTitle}
                        </Badge>
                      )}
                      {/* Price */}
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                        <span className="font-black text-white text-sm">{formatCurrency(card.price)}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-3 pb-3 pt-2 flex-1 flex flex-col">
                      <h3 className="font-bold text-cc-text-primary text-xs sm:text-sm mb-1 line-clamp-1">{card.name}</h3>
                      {card.description && (
                        <p className="text-[11px] sm:text-xs text-cc-text-secondary mb-2 flex-1 line-clamp-2">{card.description}</p>
                      )}
                      <div className="flex gap-2 mt-auto">
                        <Button
                          className="flex-1 bg-cc-orange text-white h-9 btn-glow-orange font-bold text-xs sm:text-sm rounded-xl group-hover:shadow-lg transition-all duration-300"
                          onClick={() => {
                            addToCart({
                              id: `card-${card.id}`,
                              type: 'card',
                              name: card.name,
                              price: card.price,
                              quantity: 1,
                              imageUrl: card.imageUrl || '',
                              operator: card.operator,
                              cardId: card.id,
                            })
                            setCartOpen(true)
                          }}
                        >
                          Acheter
                        </Button>
                        <Button
                          variant="outline"
                          className="border-cc-orange/30 text-cc-orange hover:bg-cc-orange/10 h-9 px-2.5 rounded-xl"
                          onClick={() => {
                            addToCart({
                              id: `card-${card.id}`,
                              type: 'card',
                              name: card.name,
                              price: card.price,
                              quantity: 1,
                              imageUrl: card.imageUrl || '',
                              operator: card.operator,
                              cardId: card.id,
                            })
                            toast.success(`${card.name} ajouté au panier !`)
                          }}
                          title="Ajouter au panier"
                        >
                          Ajouter
                        </Button>
                      </div>
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
