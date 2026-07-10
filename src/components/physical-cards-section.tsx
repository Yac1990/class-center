'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/commissions'
import { OPERATOR_INFO } from '@/lib/constants'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface PhysicalCardsSectionProps {
  onSeeMore?: () => void
}

export function PhysicalCardsSection({ onSeeMore }: PhysicalCardsSectionProps = {}) {
  const [sections, setSections] = useState<any[]>([])
  const [unassignedCards, setUnassignedCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  const handleAddToCart = (card: any) => {
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
  }

  const handleBuyNow = (card: any) => {
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
  }

  const renderProductCard = (card: any, index: number) => {
    const opInfo = OPERATOR_INFO[card.operator] || OPERATOR_INFO.ORANGE

    return (
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 }}
        className="group"
      >
        <Card className="glow-card bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden h-full flex flex-col">
          {/* Card image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-cc-surface-container-high">
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cc-surface-container-high to-cc-surface-container">
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <Badge className={`absolute top-3 left-3 ${opInfo.bg} ${opInfo.color} text-[10px] font-bold tracking-wide shadow-lg`}>
              {opInfo.name}
            </Badge>
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <span className="font-black text-white text-lg">{formatCurrency(card.price)}</span>
            </div>
          </div>

          {/* Card info */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-cc-text-primary text-base mb-1 line-clamp-1">{card.name}</h3>
            {card.description && (
              <p className="text-sm text-cc-text-secondary mb-4 flex-1 line-clamp-2">{card.description}</p>
            )}
            {/* Two buttons: Acheter now + Add to cart */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-cc-orange to-cc-orange/90 text-white h-11 btn-glow-orange font-bold text-sm rounded-xl group-hover:shadow-lg transition-all duration-300"
                onClick={() => handleBuyNow(card)}
              >
                Acheter
              </Button>
              <Button
                variant="outline"
                className="border-cc-orange/30 text-cc-orange hover:bg-cc-orange/10 h-11 px-3 rounded-xl"
                onClick={() => handleAddToCart(card)}
                title="Ajouter au panier"
              >
                +
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <section className="py-16 bg-cc-surface-dim">
        <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-2xl bg-cc-surface-container animate-pulse" />)}
          </div>
        </div>
      </section>
    )
  }

  const hasCards = sections.some((s: any) => s.cards?.length > 0) || unassignedCards.length > 0
  if (!hasCards) return null

  return (
    <section id="section-physical-cards" className="py-16 bg-cc-surface-dim">
      <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cc-surface-container border border-cc-orange/20 rounded-full mb-4">
            <span className="text-[11px] uppercase tracking-widest text-cc-orange font-medium">Boutique</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-3">
            Cartes de recharges
          </h2>
          <p className="text-cc-text-secondary max-w-md mx-auto text-sm">
            Cartes de recharge Orange, MTN, Moov. Paiement via Wave ou Djamo — code livré par WhatsApp.
          </p>
        </motion.div>

        {/* Render each section */}
        {sections.map((section: any) => {
          const sectionCards = section.cards || []
          if (sectionCards.length === 0) return null

          return (
            <div key={section.id} className="mb-12 last:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-cc-text-primary mb-2">
                  {section.title}
                </h3>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionCards.map((card: any, index: number) => renderProductCard(card, index))}
              </div>
            </div>
          )
        })}

        {/* Unassigned cards */}
        {unassignedCards.length > 0 && (
          <div className="mb-12 last:mb-0">
            {sections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-cc-text-primary mb-2">
                  Autres cartes
                </h3>
              </motion.div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedCards.map((card: any, index: number) => renderProductCard(card, index))}
            </div>
          </div>
        )}
      </div>

      {/* Voir plus button */}
      {onSeeMore && hasCards && (
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Button
            size="lg"
            variant="outline"
            className="border-cc-border text-cc-text-primary hover:bg-cc-surface-container-high hover:border-cc-orange/30 px-8 h-12 text-base gap-2 rounded-xl"
            onClick={onSeeMore}
          >
            Voir plus de produits
            <Badge className="bg-cc-orange/10 text-cc-orange border-cc-orange/20 text-[10px] ml-1">
              {sections.reduce((acc: number, s: any) => acc + (s.cards?.length || 0), 0) + unassignedCards.length}
            </Badge>
          </Button>
        </motion.div>
      )}
    </section>
  )
}

