'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CreditCard, Shield, Clock, CheckCircle, ArrowRight,
  MessageCircle, Wallet, Smartphone, Monitor, AlertCircle,
  Lock, ChevronRight, Sparkles, Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/commissions'
import { OPERATOR_INFO, DJAMO_PAY_LINK, WAVE_PAY_LINK, WHATSAPP_LINK, WHATSAPP_NUMBER } from '@/lib/constants'

type Step = 'method' | 'paying' | 'confirm' | 'success'

interface PaymentOverlayProps {
  card: any
  onClose: () => void
}

// ==========================================
// STEP INDICATOR
// ==========================================
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { id: 'method' as Step, label: 'Paiement', num: 1 },
    { id: 'paying' as Step, label: 'En cours', num: 2 },
    { id: 'confirm' as Step, label: 'Confirmation', num: 3 },
    { id: 'success' as Step, label: 'Livraison', num: 4 },
  ]

  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-1.5">
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
              ${i <= currentIndex
                ? 'bg-gradient-to-r from-cc-orange to-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-[#2a2a2a] text-[#a89080]/50 border border-white/[0.06]'
              }
            `}>
              {i < currentIndex ? <CheckCircle className="w-4 h-4" /> : step.num}
            </div>
            <span className={`
              text-xs font-medium hidden sm:block transition-colors duration-300
              ${i <= currentIndex ? 'text-[#e5e2e1]' : 'text-[#a89080]/40'}
            `}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`
              w-6 sm:w-10 h-[2px] rounded-full transition-all duration-500
              ${i < currentIndex ? 'bg-gradient-to-r from-cc-orange to-orange-500' : 'bg-[#2a2a2a]'}
            `} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ==========================================
// PAYMENT OVERLAY - E-Commerce Checkout
// ==========================================
export function PaymentOverlay({ card, onClose }: PaymentOverlayProps) {
  const [step, setStep] = useState<Step>('method')
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'djamo' | null>(null)
  const [confirmTimer, setConfirmTimer] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const opInfo = OPERATOR_INFO[card.operator] || OPERATOR_INFO.ORANGE

  // Security timer
  useEffect(() => {
    if (step !== 'paying' || confirmTimer <= 0) return
    const interval = setInterval(() => {
      setConfirmTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [step, confirmTimer > 0])

  // Auto open payment link when method is selected
  const handleSelectMethod = (method: 'wave' | 'djamo') => {
    setPaymentMethod(method)
    setStep('paying')
    setConfirmTimer(15)
    const link = method === 'wave' ? WAVE_PAY_LINK : DJAMO_PAY_LINK
    window.open(link, '_blank')
  }

  const handleOpenPaymentLink = () => {
    const link = paymentMethod === 'wave' ? WAVE_PAY_LINK : DJAMO_PAY_LINK
    window.open(link, '_blank')
  }

  const handleConfirmPayment = async () => {
    if (confirmTimer > 0) return
    setConfirmed(true)
    setStep('confirm')

    // Create a transaction record for the physical card purchase
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `card-${card.id}`,
          amount: card.price,
          paymentMethod: paymentMethod?.toUpperCase() || 'WAVE',
          type: 'PHYSICAL_CARD',
          planName: card.name,
          cardName: card.name,
          cardId: card.id,
          operator: card.operator || 'ALL',
        }),
      })
    } catch {
      // Silent fail — the transaction is for reporting purposes only
    }
  }

  const handleValidateWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour ! J'ai acheté la ${card.name} (${formatCurrency(card.price)}) sur CLASS CENTER. J'ai effectué le paiement via ${paymentMethod === 'wave' ? 'Wave' : 'Djamo'} et je voudrais recevoir le code de la carte grattée. Merci !`
    )
    window.open(`${WHATSAPP_LINK}?text=${message}`, '_blank')
    setStep('success')
  }

  const handleBack = () => {
    if (step === 'paying') {
      setStep('method')
      setPaymentMethod(null)
      setConfirmTimer(0)
    } else if (step === 'confirm') {
      setStep('paying')
      setConfirmed(false)
    }
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
          className="relative w-full max-w-lg mx-auto my-4 sm:my-8 min-h-0"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Main checkout card */}
          <div className="bg-[#111111] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-cc-orange/10 via-orange-900/5 to-cc-orange/10 border-b border-white/[0.06] px-5 pt-5 pb-4">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#a89080]" />
              </button>

              {/* Secure badge */}
              <div className="flex items-center gap-1.5 mb-3">
                <Lock className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] uppercase tracking-widest text-green-400 font-semibold">Paiement Sécurisé</span>
              </div>

              {/* Product summary */}
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden shrink-0">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-[#a89080]/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#e5e2e1] text-base truncate">{card.name}</h3>
                  <Badge className={`${opInfo.bg} ${opInfo.color} text-[9px] mt-1`}>{opInfo.name}</Badge>
                  <div className="mt-1.5">
                    <span className="font-black text-xl gradient-text">{formatCurrency(card.price)}</span>
                  </div>
                </div>
              </div>

              {/* Step indicator */}
              <div className="mt-4 pt-3 border-t border-white/[0.04]">
                <StepIndicator currentStep={step} />
              </div>
            </div>

            {/* Content area */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {/* STEP 1: Choose payment method */}
                {step === 'method' && (
                  <motion.div
                    key="method"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-lg font-bold text-[#e5e2e1] mb-1">Choisissez votre moyen de paiement</h4>
                    <p className="text-sm text-[#a89080] mb-5">Sélectionnez la méthode qui vous convient le mieux</p>

                    <div className="space-y-3">
                      {/* Wave option */}
                      <button
                        onClick={() => handleSelectMethod('wave')}
                        className="w-full group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4 text-left hover:border-cc-orange/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-cc-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cc-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <span className="text-white font-black text-lg">W</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#e5e2e1]">Wave</span>
                              <Badge className="bg-cc-orange/10 text-cc-orange text-[9px] border-cc-orange/20">Populaire</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Monitor className="w-3 h-3 text-[#a89080]" />
                              <span className="text-xs text-[#a89080]">Idéal pour ordinateur</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#a89080]/40 group-hover:text-cc-orange transition-colors" />
                        </div>
                      </button>

                      {/* Djamo option */}
                      <button
                        onClick={() => handleSelectMethod('djamo')}
                        className="w-full group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4 text-left hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Wallet className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#e5e2e1]">Djamo</span>
                              <Badge className="bg-green-500/10 text-green-400 text-[9px] border-green-500/20">Multi-wallet</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Smartphone className="w-3 h-3 text-[#a89080]" />
                              <span className="text-xs text-[#a89080]">Wave, Orange, MTN, Moov — Smartphone</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#a89080]/40 group-hover:text-green-400 transition-colors" />
                        </div>
                      </button>
                    </div>

                    {/* Security note */}
                    <div className="flex items-center gap-2 mt-5 p-3 rounded-xl bg-[#1a1a1a] border border-white/[0.04]">
                      <Shield className="w-4 h-4 text-cc-blue shrink-0" />
                      <p className="text-[11px] text-[#a89080]">
                        Vos transactions sont sécurisées. Après le paiement, vous recevrez votre code par WhatsApp.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Payment in progress */}
                {step === 'paying' && (
                  <motion.div
                    key="paying"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button onClick={handleBack} className="flex items-center gap-1 text-sm text-[#a89080] hover:text-[#e5e2e1] mb-4 transition-colors">
                      ← Retour
                    </button>

                    <h4 className="text-lg font-bold text-[#e5e2e1] mb-1">
                      Effectuez votre paiement
                    </h4>
                    <p className="text-sm text-[#a89080] mb-5">
                      via {paymentMethod === 'wave' ? 'Wave' : 'Djamo'}
                    </p>

                    {/* Payment method card */}
                    <div className={`rounded-2xl border p-5 mb-5 ${
                      paymentMethod === 'wave'
                        ? 'bg-gradient-to-br from-cc-orange/10 to-orange-900/5 border-cc-orange/20'
                        : 'bg-gradient-to-br from-green-500/10 to-green-900/5 border-green-500/20'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          paymentMethod === 'wave'
                            ? 'bg-gradient-to-br from-cc-orange to-orange-600'
                            : 'bg-gradient-to-br from-green-500 to-green-600'
                        }`}>
                          {paymentMethod === 'wave'
                            ? <span className="text-white font-black text-base">W</span>
                            : <Wallet className="w-5 h-5 text-white" />
                          }
                        </div>
                        <div>
                          <p className="font-bold text-[#e5e2e1]">
                            {paymentMethod === 'wave' ? 'Wave Pay' : 'Djamo Pay'}
                          </p>
                          <p className="text-xs text-[#a89080]">
                            {paymentMethod === 'wave'
                              ? 'Paiement Wave sur ordinateur'
                              : 'Wave, Orange Money, MTN, Moov'}
                          </p>
                        </div>
                      </div>

                      {/* Reopen payment link */}
                      <Button
                        className={`w-full h-11 rounded-xl font-bold ${
                          paymentMethod === 'wave'
                            ? 'bg-gradient-to-r from-cc-orange to-orange-600 text-white btn-glow-orange'
                            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                        }`}
                        onClick={handleOpenPaymentLink}
                      >
                        Ouvrir {paymentMethod === 'wave' ? 'Wave' : 'Djamo'} Pay
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    {/* Amount summary */}
                    <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] p-4 mb-5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#a89080]">Montant à payer</span>
                        <span className="font-black text-xl gradient-text">{formatCurrency(card.price)}</span>
                      </div>
                    </div>

                    {/* Timer */}
                    {confirmTimer > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-yellow-500/5 border border-yellow-500/15 p-4 mb-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Clock className="w-8 h-8 text-yellow-500" />
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Clock className="w-8 h-8 text-yellow-500/30" />
                            </motion.div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-yellow-400">
                              Attendez {confirmTimer}s
                            </p>
                            <p className="text-xs text-[#a89080]">
                              Effectuez d&apos;abord le paiement avant de confirmer
                            </p>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${((15 - confirmTimer) / 15) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Confirm button */}
                    <button
                      onClick={handleConfirmPayment}
                      disabled={confirmTimer > 0}
                      className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                        confirmTimer > 0
                          ? 'border-white/[0.04] bg-[#1a1a1a] opacity-50 cursor-not-allowed'
                          : 'border-cc-orange/30 bg-cc-orange/5 hover:bg-cc-orange/10 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          confirmTimer > 0 ? 'border-white/[0.08]' : 'border-cc-orange'
                        }`}>
                          {confirmTimer <= 0 && <CheckCircle className="w-4 h-4 text-cc-orange" />}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${confirmTimer > 0 ? 'text-[#a89080]/50' : 'text-[#e5e2e1]'}`}>
                            J&apos;ai effectué le paiement
                          </p>
                          <p className="text-xs text-[#a89080]">
                            Cochez uniquement si vous avez vraiment payé
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Fraud warning */}
                    <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-red-400/80">
                        Tout faux signalement de paiement sera signalé et votre compte pourra être suspendu définitivement.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Confirm & validate via WhatsApp */}
                {step === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button onClick={handleBack} className="flex items-center gap-1 text-sm text-[#a89080] hover:text-[#e5e2e1] mb-4 transition-colors">
                      ← Retour
                    </button>

                    {/* Success animation */}
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4"
                      >
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </motion.div>
                      <h4 className="text-xl font-black text-[#e5e2e1] mb-1">Paiement confirmé !</h4>
                      <p className="text-sm text-[#a89080]">
                        Validez votre achat via WhatsApp pour recevoir votre code
                      </p>
                    </div>

                    {/* Order summary */}
                    <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4 mb-5">
                      <h5 className="text-xs uppercase tracking-widest text-[#a89080] mb-3 font-semibold">Récapitulatif</h5>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-[#222] border border-white/[0.06] overflow-hidden shrink-0">
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-[#a89080]/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#e5e2e1] text-sm truncate">{card.name}</p>
                          <p className="text-xs text-[#a89080]">
                            via {paymentMethod === 'wave' ? 'Wave' : 'Djamo'}
                          </p>
                        </div>
                        <span className="font-black text-base gradient-text">{formatCurrency(card.price)}</span>
                      </div>
                      <div className="border-t border-white/[0.04] pt-2 flex justify-between items-center">
                        <span className="text-xs text-[#a89080]">Total payé</span>
                        <span className="font-black text-lg text-[#e5e2e1]">{formatCurrency(card.price)}</span>
                      </div>
                    </div>

                    {/* WhatsApp CTA */}
                    <Button
                      onClick={handleValidateWhatsApp}
                      className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-base rounded-2xl hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/20 transition-all duration-300"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Valider via WhatsApp
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <p className="text-[11px] text-[#a89080] text-center mt-3">
                      Vous serez redirigé vers WhatsApp pour confirmer votre achat et recevoir votre code gratté
                    </p>
                  </motion.div>
                )}

                {/* STEP 4: Success */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-6"
                  >
                    {/* Confetti-style sparkle */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-5"
                    >
                      <Sparkles className="w-12 h-12 text-green-400" />
                    </motion.div>

                    <h4 className="text-2xl font-black gradient-text mb-2">Merci !</h4>
                    <p className="text-[#a89080] mb-6">
                      Votre achat a été enregistré avec succès. Notre équipe vous livrera le code sous peu via WhatsApp.
                    </p>

                    {/* Info box */}
                    <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4 mb-6 text-left">
                      <div className="flex items-center gap-3 mb-3">
                        <Phone className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-[#e5e2e1]">Prochaine étape</span>
                      </div>
                      <p className="text-sm text-[#a89080]">
                        Envoyez le message WhatsApp qui s&apos;est ouvert et attendez la réponse de notre équipe. 
                        Votre code sera livré dans les plus brefs délais.
                      </p>
                    </div>

                    {/* Contact info */}
                    <div className="rounded-xl bg-cc-blue/5 border border-cc-blue/10 p-3 mb-6">
                      <p className="text-xs text-[#a89080]">
                        Besoin d&apos;aide ? Contactez-nous : <span className="text-cc-blue font-semibold">{WHATSAPP_NUMBER}</span>
                      </p>
                    </div>

                    <Button
                      onClick={onClose}
                      className="w-full h-12 bg-[#1a1a1a] border border-white/[0.08] text-[#e5e2e1] font-semibold rounded-xl hover:bg-[#222] transition-colors"
                    >
                      Fermer
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer trust badges */}
            {step !== 'success' && (
              <div className="px-5 py-3 border-t border-white/[0.04] bg-[#0d0d0d] flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#a89080]/50" />
                  <span className="text-[10px] text-[#a89080]/50">Sécurisé</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#a89080]/20" />
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#a89080]/50" />
                  <span className="text-[10px] text-[#a89080]/50">Chiffré</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#a89080]/20" />
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#a89080]/50" />
                  <span className="text-[10px] text-[#a89080]/50">WhatsApp</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
