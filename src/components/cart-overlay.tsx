'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Minus, Plus, Trash2, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useAppStore, CartItem } from '@/lib/store'
import { formatCurrency, formatPhoneNumber, stripFormatting } from '@/lib/commissions'
import { OPERATOR_INFO, WAVE_PAY_LINK, DJAMO_PAY_LINK, WHATSAPP_LINK, WHATSAPP_NUMBER } from '@/lib/constants'

// ==========================================
// CART OVERLAY - Multi-product checkout
// ==========================================
export function CartOverlay() {
  const {
    cart, cartOpen, setCartOpen, removeFromCart,
    updateCartQuantity, clearCart, cartTotal, user,
  } = useAppStore()

  const [step, setStep] = useState<'cart' | 'checkout' | 'paying' | 'success'>('cart')
  const [submitting, setSubmitting] = useState(false)

  // Checkout form
  const [clientName, setClientName] = useState(user?.name || '')
  const [clientPhone, setClientPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'WAVE' | 'DJAMO' | 'LIVRAISON'>('WAVE')

  // Promo code
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoValidating, setPromoValidating] = useState(false)

  const total = cartTotal()
  const finalTotal = Math.max(0, total - promoDiscount)

  const hasFlashItems = cart.some(i => i.type === 'flash')
  const hasCardItems = cart.some(i => i.type === 'card')
  const onlyCardItems = hasCardItems && !hasFlashItems
  const onlyFlashItems = hasFlashItems && !hasCardItems

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripFormatting(e.target.value)
    if (raw.length <= 10) {
      setClientPhone(formatPhoneNumber(raw))
    }
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !user?.id) return
    setPromoValidating(true)
    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), userId: user.id, validateOnly: true }),
      })
      const data = await res.json()
      if (res.ok && data.amount) {
        setPromoDiscount(data.amount)
        toast.success(`Code promo appliqué : -${formatCurrency(data.amount)}`)
      } else {
        toast.error(data.error || 'Code promo invalide')
      }
    } catch {
      toast.error('Erreur de validation du code promo')
    } finally {
      setPromoValidating(false)
    }
  }

  const handleCheckout = async () => {
    if (!clientName.trim()) {
      toast.error('Veuillez entrer votre nom')
      return
    }
    const rawPhone = stripFormatting(clientPhone)
    if (rawPhone.length < 10) {
      toast.error('Veuillez entrer un numéro de téléphone valide')
      return
    }

    // For flash items, delivery address is required
    if (hasFlashItems && !deliveryAddress.trim()) {
      toast.error('Veuillez entrer une adresse de livraison')
      return
    }

    setSubmitting(true)

    try {
      // 1. Submit flash product orders (COD)
      const flashItems = cart.filter(i => i.type === 'flash')
      if (flashItems.length > 0) {
        const res = await fetch('/api/flash-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: flashItems.map(item => ({
              productId: item.productId || item.id,
              quantity: item.quantity,
            })),
            clientName: clientName.trim(),
            clientPhone: rawPhone,
            deliveryAddress: deliveryAddress.trim(),
            deliveryCity: deliveryCity.trim(),
            note: note.trim(),
            userId: user?.id || undefined,
            amount: flashItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erreur commande flash')
        }
      }

      // 2. Submit physical card orders — one transaction per card item for proper tracking & loyalty
      const cardItems = cart.filter(i => i.type === 'card')
      if (cardItems.length > 0) {
        for (const cardItem of cardItems) {
          const itemTotal = cardItem.price * cardItem.quantity
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientName: clientName.trim(),
              phone: rawPhone,
              operator: cardItem.operator || 'ALL',
              amount: itemTotal,
              paymentMethod: paymentMethod,
              type: 'PHYSICAL_CARD',
              cardName: `${cardItem.name} x${cardItem.quantity}`,
              cardId: cardItem.cardId || cardItem.id,
              userId: user?.id || undefined,
            }),
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || `Erreur commande carte ${cardItem.name}`)
          }
        }

        // Open payment link in a new tab (Wave or Djamo)
        const paymentLink = paymentMethod === 'DJAMO' ? DJAMO_PAY_LINK : WAVE_PAY_LINK
        window.open(paymentLink, '_blank')
      }

      // 3. Mark promo code as used if applied
      if (promoDiscount > 0 && promoCode.trim() && user?.id) {
        try {
          await fetch('/api/promo-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: promoCode.trim(), userId: user.id }),
          })
        } catch {}
      }

      setStep('success')
      clearCart()
      toast.success('Commande effectuée avec succès !')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la commande')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--cc-surface-container-high)',
    borderColor: 'var(--cc-border-subtle)',
    color: 'var(--cc-text-primary)',
  }
  const inputClass = "rounded-xl h-11 focus:ring-orange-500/30 focus:border-orange-500/40"

  if (!cartOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false) }}
      >
        <motion.div
          className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: 'var(--cc-surface-container)',
            borderColor: 'var(--cc-border-subtle)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--cc-border-subtle)' }}>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--cc-text-primary)' }}>Mon Panier</h2>
              <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-xs">
                {cart.length} article{cart.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cc-surface-container-high transition-colors"
            >
              <X className="w-4 h-4" style={{ color: 'var(--cc-text-secondary)' }} />
            </button>
          </div>

          {/* Content */}
          {step === 'cart' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-cc-text-secondary text-sm">Votre panier est vide</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-cc-orange/30 text-cc-orange hover:bg-orange-500/10"
                    onClick={() => setCartOpen(false)}
                  >
                    Continuer mes achats
                  </Button>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <CartItemRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onUpdateQuantity={(qty) => updateCartQuantity(item.id, qty)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  ))}

                  {/* Promo code input */}
                  {user?.id && (
                    <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--cc-surface-container-high)' }}>
                      <Label className="text-xs font-medium mb-2 block" style={{ color: 'var(--cc-text-secondary)' }}>
                        Code promo
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value)}
                          placeholder="CASH-5K-XXXXXX"
                          style={inputStyle}
                          className="flex-1 h-9 text-sm rounded-lg"
                        />
                        <Button
                          size="sm"
                          onClick={handleApplyPromo}
                          disabled={promoValidating || !promoCode.trim()}
                          className="bg-cc-orange hover:bg-orange-600 text-white h-9 px-3"
                        >
                          {promoValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Appliquer'}
                        </Button>
                      </div>
                      {promoDiscount > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Réduction : -{formatCurrency(promoDiscount)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--cc-surface-container-high)' }}>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--cc-text-secondary)' }}>Sous-total</span>
                        <span style={{ color: 'var(--cc-text-primary)' }}>{formatCurrency(total)}</span>
                      </div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--cc-text-secondary)' }}>Réduction</span>
                        <span className="text-green-600 dark:text-green-400">-{formatCurrency(promoDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold" style={{ color: 'var(--cc-text-primary)' }}>Total</span>
                      <span className="text-2xl font-black gradient-text">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Checkout button */}
                  <Button
                    onClick={() => setStep('checkout')}
                    className="w-full h-14 bg-gradient-to-r from-cc-orange to-orange-600 text-white font-bold text-base rounded-2xl hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 transition-all duration-300"
                  >
                    Passer la commande - {formatCurrency(finalTotal)}
                  </Button>

                  <button
                    onClick={clearCart}
                    className="w-full text-center text-sm py-2 transition-colors hover:text-red-500"
                    style={{ color: 'var(--cc-text-secondary)' }}
                  >
                    Vider le panier
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'checkout' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <button
                onClick={() => setStep('cart')}
                className="text-sm flex items-center gap-1 transition-colors"
                style={{ color: 'var(--cc-text-secondary)' }}
              >
                ← Retour au panier
              </button>

              <h3 className="text-lg font-bold" style={{ color: 'var(--cc-text-primary)' }}>
                {onlyCardItems ? 'Informations de paiement' : 'Informations de commande'}
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Votre nom complet"
                    style={inputStyle}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>
                    Téléphone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={clientPhone}
                    onChange={handlePhoneChange}
                    placeholder="07 XX XX XX XX"
                    style={inputStyle}
                    className={inputClass}
                  />
                </div>

                {/* Delivery address only for flash items */}
                {hasFlashItems && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>
                      Adresse de livraison <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Votre adresse complète"
                      rows={2}
                      style={{ ...inputStyle, resize: 'none' }}
                      className="rounded-xl focus:ring-orange-500/30 focus:border-orange-500/40"
                    />
                  </div>
                )}

                {/* City — shown for flash items or mixed */}
                {hasFlashItems && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>Ville</Label>
                    <Input
                      value={deliveryCity}
                      onChange={e => setDeliveryCity(e.target.value)}
                      placeholder="Abidjan, Cocody..."
                      style={inputStyle}
                      className={inputClass}
                    />
                  </div>
                )}

                {/* Payment method for cards — Wave/Djamo only, no delivery */}
                {hasCardItems && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>
                      Mode de paiement
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'WAVE' as const, label: 'Wave', icon: '🌊' },
                        { id: 'DJAMO' as const, label: 'Djamo', icon: '💳' },
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-3 rounded-xl text-center transition-all duration-200 border ${
                            paymentMethod === method.id
                              ? 'border-cc-orange bg-orange-500/10 shadow-sm'
                              : ''
                          }`}
                          style={{
                            borderColor: paymentMethod === method.id ? undefined : 'var(--cc-border-subtle)',
                            backgroundColor: paymentMethod === method.id ? undefined : 'var(--cc-surface-container-high)',
                          }}
                        >
                          <span className="text-xl block mb-1">{method.icon}</span>
                          <span className="text-xs font-medium" style={{ color: 'var(--cc-text-primary)' }}>{method.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--cc-text-secondary)' }}>
                      💡 Paiement via {paymentMethod === 'DJAMO' ? 'Djamo' : 'Wave'}, votre code de recharge sera livré par WhatsApp
                    </p>
                  </div>
                )}

                {/* Note */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>Note (optionnel)</Label>
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Instructions spéciales..."
                    rows={2}
                    style={{ ...inputStyle, resize: 'none' }}
                    className="rounded-xl focus:ring-orange-500/30 focus:border-orange-500/40"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--cc-surface-container-high)' }}>
                <div className="space-y-1 mb-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--cc-text-secondary)' }}>{item.name} × {item.quantity}</span>
                      <span style={{ color: 'var(--cc-text-primary)' }}>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2 bg-cc-border" />
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: 'var(--cc-text-primary)' }}>Total</span>
                  <span className="text-xl font-black gradient-text">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-base rounded-2xl hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 transition-all duration-300 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {onlyCardItems ? 'Payer' : 'Confirmer la commande'} - {formatCurrency(finalTotal)}
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
              >
                <span className="text-4xl">✅</span>
              </motion.div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--cc-text-primary)' }}>
                Commande confirmée !
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--cc-text-secondary)' }}>
                {onlyCardItems
                  ? 'Votre achat de cartes a été enregistré avec succès.'
                  : 'Votre commande a été enregistrée. Vous serez livré bientôt.'
                }
              </p>
              {onlyCardItems && (
                <>
                  <div className="w-full p-4 rounded-xl mb-4 space-y-3" style={{ backgroundColor: 'var(--cc-surface-container-high)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--cc-text-secondary)' }}>Étapes suivantes :</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span className="text-xs" style={{ color: 'var(--cc-text-primary)' }}>Effectuez le paiement de <strong>{formatCurrency(finalTotal)}</strong> via <strong>{paymentMethod === 'DJAMO' ? 'Djamo' : 'Wave'}</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span className="text-xs" style={{ color: 'var(--cc-text-primary)' }}>Envoyez la preuve de paiement via WhatsApp pour recevoir vos codes de recharge</span>
                      </div>
                    </div>
                  </div>
                  {/* Payment link button */}
                  <a
                    href={paymentMethod === 'DJAMO' ? DJAMO_PAY_LINK : WAVE_PAY_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm mb-2 w-full justify-center transition-colors"
                  >
                    Payer via {paymentMethod === 'DJAMO' ? 'Djamo' : 'Wave'}
                  </a>
                  {/* WhatsApp button with pre-filled message */}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(`Bonjour, j'ai commandé des cartes de recharge sur Class Center.\n\nNom: ${clientName}\nTéléphone: ${clientPhone}\nMontant: ${formatCurrency(finalTotal)}\nPaiement: ${paymentMethod === 'DJAMO' ? 'Djamo' : 'Wave'}\n\nJe souhaite recevoir mes codes de recharge. Merci !`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm mb-4 w-full justify-center transition-colors"
                  >
                    Recevoir mes codes via WhatsApp
                  </a>
                </>
              )}
              <Button
                onClick={() => { setCartOpen(false); setStep('cart') }}
                className="bg-cc-orange hover:bg-orange-600 text-white px-8"
              >
                Fermer
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ==========================================
// CART ITEM ROW
// ==========================================
function CartItemRow({ item, onUpdateQuantity, onRemove }: {
  item: CartItem
  onUpdateQuantity: (qty: number) => void
  onRemove: () => void
}) {
  const opInfo = OPERATOR_INFO[item.operator || ''] || null

  return (
    <div
      className="flex gap-3 p-3 rounded-xl"
      style={{ backgroundColor: 'var(--cc-surface-container-high)' }}
    >
      {/* Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-cc-surface-container">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-cc-surface-container-high">
            <span className="text-[10px] text-cc-text-secondary/50 font-bold uppercase tracking-tighter">
              {item.type === 'flash' ? 'Flash' : 'Carte'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--cc-text-primary)' }}>
              {item.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                {item.type === 'flash' ? '🔥 Flash' : '💳 Carte'}
              </Badge>
              {opInfo && (
                <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${opInfo.color}`}>
                  {opInfo.name}
                </Badge>
              )}
            </div>
          </div>
          <button onClick={onRemove} className="shrink-0 p-1 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:bg-cc-surface-container"
              style={{ borderColor: 'var(--cc-border-subtle)' }}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-bold min-w-[1.5rem] text-center" style={{ color: 'var(--cc-text-primary)' }}>
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:bg-cc-surface-container"
              style={{ borderColor: 'var(--cc-border-subtle)' }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="font-bold text-sm gradient-text">
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// FLOATING CART BUTTON
// ==========================================
export function FloatingCartButton() {
  const { cart, setCartOpen, cartItemCount } = useAppStore()
  const count = cartItemCount()

  if (cart.length === 0) return null

  return (
    <button
      onClick={() => setCartOpen(true)}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-cc-orange to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 group"
      aria-label="Ouvrir le panier"
    >
      <span className="text-sm">Panier</span>
      {count > 0 && (
        <Badge className="bg-white text-cc-orange font-bold text-xs min-w-[1.5rem] h-6 flex items-center justify-center rounded-full">
          {count}
        </Badge>
      )}
    </button>
  )
}
