'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, ShoppingCart, Timer, Package, Truck, Heart, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/commissions'

// ==========================================
// CATEGORY COLORS
// ==========================================
const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-500/15 text-gray-500 dark:text-gray-400',
  electronics: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  fashion: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  phone: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  food: 'bg-green-500/15 text-green-600 dark:text-green-400',
  beauty: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  home: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
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

// ==========================================
// COUNTDOWN TIMER COMPONENT
// ==========================================
function CountdownTimer({ targetDate, compact = false }: { targetDate: string | Date; compact?: boolean }) {
  const calculateTimeLeft = () => {
    const difference = new Date(targetDate).getTime() - new Date().getTime()
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    }
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
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.expired) return null

  const pad = (n: number) => n.toString().padStart(2, '0')

  const units = timeLeft.days > 0
    ? [
        { value: String(timeLeft.days), label: 'j' },
        { value: pad(timeLeft.hours), label: 'h' },
        { value: pad(timeLeft.minutes), label: 'm' },
      ]
    : [
        { value: pad(timeLeft.hours), label: 'h' },
        { value: pad(timeLeft.minutes), label: 'm' },
        { value: pad(timeLeft.seconds), label: 's' },
      ]

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {units.map((unit, i) => (
          <React.Fragment key={unit.label}>
            {i > 0 && <span className="text-red-500/50 dark:text-red-400/50 text-[9px]">:</span>}
            <span className="bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold px-1 py-0.5 rounded min-w-[20px] text-center inline-block">
              {unit.value}{unit.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Timer className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
      <div className="flex items-center gap-1">
        {units.map((unit, i) => (
          <React.Fragment key={unit.label}>
            {i > 0 && <span className="text-red-500/50 dark:text-red-400/50 text-xs">:</span>}
            <span className="bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[26px] text-center inline-block">
              {unit.value}{unit.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// FLASH SALE SECTION
// ==========================================
interface FlashSaleSectionProps {
  onBuyProduct: (product: any) => void
  onSeeMore?: () => void
}

export function FlashSaleSection({ onBuyProduct, onSeeMore }: FlashSaleSectionProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('cc_liked_products')
      if (stored) {
        const ids: string[] = JSON.parse(stored)
        return new Set(ids)
      }
    } catch {}
    return new Set()
  })

  const toggleLike = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isLiked = likedProducts.has(productId)

    // Update localStorage
    const newLiked = new Set(likedProducts)
    if (isLiked) {
      newLiked.delete(productId)
    } else {
      newLiked.add(productId)
    }
    setLikedProducts(newLiked)
    localStorage.setItem('cc_liked_products', JSON.stringify([...newLiked]))

    // Update server
    try {
      await fetch('/api/flash-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, like: !isLiked }),
      })
      // Update local product likes count
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, likes: Math.max(0, (p.likes || 0) + (isLiked ? -1 : 1)) }
          : p
      ))
    } catch {}
  }

  useEffect(() => {
    fetch('/api/flash-products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <section className="py-16 bg-cc-surface-dim">
        <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 rounded-2xl bg-cc-surface-container animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Don't render if no active products
  if (products.length === 0) return null

  // Check if any product has a saleEndsAt (for global countdown)
  const firstExpiring = products.find((p: any) => p.saleEndsAt && new Date(p.saleEndsAt) > new Date())

  return (
    <section className="py-16 bg-cc-surface-dim">
      <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cc-surface-container border border-red-500/20 rounded-full mb-4">
            <Zap className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span className="text-[11px] uppercase tracking-widest text-red-500 dark:text-red-400 font-medium">Vente Flash</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-3 flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-red-500 dark:text-red-400" />
            Vente Flash
          </h2>
          <div className="flex items-center justify-center gap-3">
            <p className="text-cc-text-secondary max-w-md text-sm">
              Offres limitées, ne ratez pas ces promotions exclusives !
            </p>
            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-[10px] gap-1">
              <Truck className="w-3 h-3" />
              Paiement à la livraison
            </Badge>
          </div>

          {/* Global countdown */}
          {firstExpiring && (
            <motion.div
              className="mt-4 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CountdownTimer targetDate={firstExpiring.saleEndsAt} />
            </motion.div>
          )}
        </motion.div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any, index: number) => {
            const images = product.images ? product.images.split(',').filter((img: string) => img.trim()) : []
            const mainImage = images[0]?.trim() || null
            const hasDiscount = product.originalPrice > product.price
            const discountPercent = hasDiscount
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group"
              >
                <Card className="glow-card bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden h-full flex flex-col">
                  {/* Image area - Premium showcase with blurred background fill */}
                  <div
                    className="relative w-full min-h-[220px] max-h-[350px] flex items-center justify-center overflow-hidden"
                  >
                    {/* Blurred background image to fill the frame */}
                    {mainImage && (
                      <img
                        src={mainImage}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30"
                      />
                    )}
                    {/* Subtle dark overlay for contrast */}
                    <div className="absolute inset-0 bg-cc-surface-container/60" />

                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="relative z-10 max-h-[240px] max-w-[85%] object-contain object-center drop-shadow-xl group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full min-h-[220px] flex items-center justify-center">
                        <Package className="w-16 h-16 text-cc-text-secondary/20" />
                      </div>
                    )}
                    {/* Category badge - top-left of image area */}
                    {product.category && product.category !== 'general' && (
                      <div className="absolute top-3 left-3 z-20">
                        <Badge className={`${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.other} text-[10px] font-bold shadow-lg backdrop-blur-md border border-white/10`}>
                          {CATEGORY_LABELS[product.category] || product.category}
                        </Badge>
                      </div>
                    )}

                    {/* Flash badge for featured products */}
                    {product.featured && (
                      <div className="absolute top-3 right-3 z-20">
                        <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold tracking-wide shadow-lg shadow-red-500/30 border-0">
                          <Zap className="w-3 h-3 mr-0.5" />
                          Flash
                        </Badge>
                      </div>
                    )}

                    {/* Discount badge - below flash badge */}
                    {hasDiscount && (
                      <div className={`absolute ${product.featured ? 'top-12' : 'top-3'} right-3 z-20`}>
                        <Badge className="bg-red-500/90 text-white text-[10px] font-bold shadow-lg border-0">
                          -{discountPercent}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Price & Countdown - below the image */}
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-cc-text-primary text-lg">{formatCurrency(product.price)}</span>
                      {hasDiscount && (
                        <span className="text-sm text-cc-text-secondary/60 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    {product.saleEndsAt && new Date(product.saleEndsAt) > new Date() && (
                      <CountdownTimer targetDate={product.saleEndsAt} compact />
                    )}
                  </div>

                  {/* Card info */}
                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-cc-text-primary text-base mb-1 line-clamp-1 flex-1">{product.name}</h3>
                      {/* Like button */}
                      <button
                        onClick={(e) => toggleLike(product.id, e)}
                        className="flex items-center gap-1 shrink-0 p-1 -m-1 hover:scale-110 transition-transform"
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${
                            likedProducts.has(product.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-cc-text-secondary/50 hover:text-red-400'
                          }`}
                        />
                        <span className="text-xs text-cc-text-secondary font-medium">
                          {(product.likes || 0) + (likedProducts.has(product.id) ? 0 : 0)}
                        </span>
                      </button>
                    </div>

                    {product.description && (
                      <p className="text-sm text-cc-text-secondary mb-4 flex-1 line-clamp-2">{product.description}</p>
                    )}

                    {/* Acheter button */}
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white h-11 btn-glow-orange font-bold text-base rounded-xl group-hover:shadow-lg transition-all duration-300"
                      onClick={() => onBuyProduct(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Acheter
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Voir plus button */}
        {onSeeMore && products.length > 0 && (
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
              <Eye className="w-4 h-4" />
              Voir plus de produits
              <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] ml-1">
                {products.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
