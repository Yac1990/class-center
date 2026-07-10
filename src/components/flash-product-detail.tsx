'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Minus, Plus, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/commissions'
import { useAppStore } from '@/lib/store'

// ==========================================
// FLASH PRODUCT DETAIL OVERLAY - Add to Cart
// ==========================================
interface FlashProductDetailProps {
  product: any
  onClose: () => void
}

export function FlashProductDetail({ product, onClose }: FlashProductDetailProps) {
  const images = product.images
    ? product.images.split(',').map((img: string) => img.trim()).filter((img: string) => img)
    : []

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [imageDirection, setImageDirection] = useState<'left' | 'right'>('right')
  const { addToCart, setCartOpen } = useAppStore()

  const hasDiscount = product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0
  const totalAmount = product.price * quantity

  const handlePrevImage = () => {
    setImageDirection('left')
    setSelectedImageIndex(prev => (prev === 0 ? Math.min(images.length - 1, 4) : prev - 1))
  }

  const handleNextImage = () => {
    setImageDirection('right')
    setSelectedImageIndex(prev => (prev >= Math.min(images.length - 1, 4) ? 0 : prev + 1))
  }

  const handleAddToCart = () => {
    addToCart({
      id: `flash-${product.id}`,
      type: 'flash',
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: images[0] || '',
      productId: product.id,
    })
    toast.success(`${product.name} ajouté au panier !`)
    onClose()
  }

  const handleBuyNow = () => {
    addToCart({
      id: `flash-${product.id}`,
      type: 'flash',
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: images[0] || '',
      productId: product.id,
    })
    setCartOpen(true)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="relative w-full max-w-3xl mx-auto my-4 sm:my-8 min-h-0"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
            style={{
              backgroundColor: 'var(--cc-surface-container)',
              borderColor: 'var(--cc-border-subtle)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 flex items-center justify-center transition-colors border border-white/10"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Image Gallery */}
            <div className="relative w-full min-h-[250px] sm:min-h-[400px] flex items-center justify-center mx-auto overflow-hidden">
              {images.length > 0 && (
                <img src={images[selectedImageIndex]} alt="" aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" />
              )}
              <div className="absolute inset-0 bg-cc-surface-container/60" />
              {images.length > 0 ? (
                <>
                  <AnimatePresence mode="wait" custom={imageDirection}>
                    <motion.img
                      key={selectedImageIndex}
                      src={images[selectedImageIndex]}
                      alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                      className="relative z-10 max-h-[350px] sm:max-h-[450px] max-w-[85%] sm:max-w-[75%] object-contain object-center drop-shadow-2xl p-4 rounded-lg"
                      initial={{ opacity: 0, x: imageDirection === 'right' ? 40 : -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: imageDirection === 'right' ? -40 : 40 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    />
                  </AnimatePresence>
                  {images.length > 1 && (
                    <>
                      <button onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center transition-colors border border-white/10">
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 flex items-center justify-center transition-colors border border-white/10">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </>
                  )}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {images.slice(0, 5).map((img: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => { setImageDirection(i > selectedImageIndex ? 'right' : 'left'); setSelectedImageIndex(i) }}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 flex items-center justify-center ${
                            i === selectedImageIndex ? 'border-cc-orange shadow-lg shadow-cc-orange/30' : 'border-white/10 opacity-60 hover:opacity-90'
                          }`}
                          style={{ background: 'var(--cc-surface-container-high)' }}
                        >
                          <img src={img} alt={`Thumb ${i + 1}`} className="max-w-full max-h-full object-contain object-center" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full min-h-[250px] sm:min-h-[400px] flex items-center justify-center">
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="p-5 sm:p-6">
              {/* Product Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs font-bold" style={{
                    backgroundColor: 'var(--cc-surface-container-high)',
                    color: 'var(--cc-text-secondary)',
                    borderColor: 'var(--cc-border-subtle)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}>
                    {product.category || 'Général'}
                  </Badge>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-[10px] gap-1">
                    Paiement à la livraison
                  </Badge>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: 'var(--cc-text-primary)' }}>{product.name}</h2>

                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-3xl font-black gradient-text">{formatCurrency(product.price)}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg line-through" style={{ color: 'var(--cc-text-secondary)', opacity: 0.5 }}>
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <Badge className="bg-cc-orange/10 text-cc-orange border-cc-orange/20 text-[10px] font-bold">
                        -{discountPercent}%
                      </Badge>
                    </>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--cc-text-secondary)' }}>{product.description}</p>
                )}
              </div>

              {/* Divider */}
              <div className="my-6" style={{ borderTop: '1px solid var(--cc-border-subtle)' }} />

              {/* Quantity selector */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>Quantité</p>
                  <p className="text-xs" style={{ color: 'var(--cc-text-secondary)' }}>{formatCurrency(product.price)} × {quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors border"
                    style={{
                      backgroundColor: 'var(--cc-surface-container-high)',
                      borderColor: 'var(--cc-border-subtle)',
                      color: 'var(--cc-text-primary)',
                    }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-bold min-w-[2rem] text-center" style={{ color: 'var(--cc-text-primary)' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors border"
                    style={{
                      backgroundColor: 'var(--cc-surface-container-high)',
                      borderColor: 'var(--cc-border-subtle)',
                      color: 'var(--cc-text-primary)',
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleBuyNow}
                  className="w-full h-14 bg-cc-blue text-white font-bold text-base rounded-2xl hover:bg-cc-blue/90 shadow-lg shadow-cc-blue/20 transition-all duration-300"
                >
                  Acheter maintenant - {formatCurrency(totalAmount)}
                </Button>

                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="w-full h-12 border-cc-orange/30 text-cc-orange hover:bg-cc-orange/10 font-bold text-base rounded-2xl"
                >
                  Ajouter au panier
                </Button>

                <p className="text-[10px] text-center" style={{ color: 'var(--cc-text-secondary)', opacity: 0.5 }}>
                  Vous ne payez qu&apos;à la réception de votre commande
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
