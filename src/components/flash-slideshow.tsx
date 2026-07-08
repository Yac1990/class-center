'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/commissions'

// Category display helpers
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
// FLASH SALE SLIDESHOW / CAROUSEL
// Premium showcase design with dynamic backgrounds
// Clicking image opens product detail
// ==========================================
interface FlashSlideshowProps {
  onBuyProduct: (product: any) => void
}

export function FlashSlideshow({ onBuyProduct }: FlashSlideshowProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    fetch('/api/flash-products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Auto-play
  const nextSlide = useCallback(() => {
    if (products.length <= 1) return
    setCurrentIndex(prev => (prev + 1) % products.length)
  }, [products.length])

  const prevSlide = useCallback(() => {
    if (products.length <= 1) return
    setCurrentIndex(prev => (prev === 0 ? products.length - 1 : prev - 1))
  }, [products.length])

  useEffect(() => {
    if (isPaused || products.length <= 1) return
    const interval = setInterval(nextSlide, 4000)
    return () => clearInterval(interval)
  }, [isPaused, nextSlide, products.length])

  if (loading) {
    return (
      <section className="py-8 bg-cc-page-bg">
        <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-64 rounded-2xl bg-cc-surface-container animate-pulse" />
        </div>
      </section>
    )
  }

  if (products.length === 0) return null

  const currentProduct = products[currentIndex]
  const images = currentProduct.images ? currentProduct.images.split(',').filter((img: string) => img.trim()) : []
  const mainImage = images[0]?.trim() || null

  return (
    <section className="py-8 sm:py-12 bg-cc-page-bg">
      <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
        {/* Navigation dots */}
        {products.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {products.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-cc-orange w-8'
                    : 'bg-cc-text-secondary/20 hover:bg-cc-text-secondary/40 w-1.5'
                }`}
              />
            ))}
          </div>
        )}

        {/* Main Slideshow */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProduct.id}
              className="relative rounded-2xl overflow-hidden cursor-pointer group"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => onBuyProduct(currentProduct)}
            >
              {/* Image - Premium showcase with blurred background fill */}
              <div
                className="relative w-full min-h-[250px] sm:min-h-[400px] flex items-center justify-center overflow-hidden"
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
                {/* Subtle overlay for contrast */}
                <div className="absolute inset-0 bg-cc-surface-container/60" />

                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={currentProduct.name}
                    className="relative z-10 max-h-[280px] sm:max-h-[380px] max-w-[85%] sm:max-w-[70%] object-contain object-center drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full min-h-[250px] sm:min-h-[400px] flex items-center justify-center">
                    <Package className="w-20 h-20 text-cc-text-secondary/20" />
                  </div>
                )}

                {/* Dark gradient overlay at bottom for price readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Category badge - top-left */}
                {currentProduct.category && currentProduct.category !== 'general' && (
                  <div className="absolute top-3 left-4 sm:top-4 sm:left-6 z-20">
                    <Badge className={`${CATEGORY_COLORS[currentProduct.category] || CATEGORY_COLORS.other} text-[10px] font-bold shadow-lg backdrop-blur-md border border-white/10`}>
                      {CATEGORY_LABELS[currentProduct.category] || currentProduct.category}
                    </Badge>
                  </div>
                )}

                {/* Subtle vignette effect */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.15) 100%)'
                  }}
                />

                {/* Price badge on image */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20">
                  <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {formatCurrency(currentProduct.price)}
                    </span>
                    {currentProduct.originalPrice > currentProduct.price && (
                      <span className="text-sm text-white/50 line-through">
                        {formatCurrency(currentProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          {products.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevSlide() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 flex items-center justify-center transition-all duration-200 border border-white/10 z-10"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextSlide() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 flex items-center justify-center transition-all duration-200 border border-white/10 z-10"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Progress bar */}
          {products.length > 1 && !isPaused && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cc-border rounded-b-2xl overflow-hidden">
              <motion.div
                key={currentIndex}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
