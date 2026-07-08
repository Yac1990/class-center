'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Zap, CreditCard, Check, Copy, CheckCircle, Clock, AlertCircle,
  BarChart3, History, CircleDollarSign, Info, ExternalLink, Loader2, Star, Wallet, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { detectOperator, formatCurrency, maskPhone } from '@/lib/commissions'
import { OPERATOR_INFO, DJAMO_PAY_LINK, WAVE_PAY_LINK } from '@/lib/constants'
import { LoyaltyDashboard } from '@/components/loyalty-dashboard'

export function ClientSpace({ cabineToken }: { cabineToken: string | null }) {
  const [activeTab, setActiveTab] = useState('recharger')
  const { user, isLoyalClient, setUser } = useAppStore()

  // Fetch loyalty status
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/loyalty?userId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            useAppStore.getState().setUser({
              ...useAppStore.getState().user!,
              isLoyal: data.user.isLoyal,
              actionCount: data.user.actionCount,
            })
          }
        })
        .catch(() => {})
    }
  }, [user?.id])

  const bottomNavItems = [
    { id: 'recharger', label: 'Recharger', icon: Zap },
    { id: 'historique', label: 'Historique', icon: History },
    ...(isLoyalClient ? [{ id: 'tableau', label: 'Mon Tableau', icon: BarChart3 as React.ComponentType<{ className?: string }> }] : []),
  ]

  const handleBottomNav = (id: string) => {
    setActiveTab(id)
  }

  return (
    <div className="pt-14 pb-24 md:pb-0 min-h-screen bg-cc-page-bg">
      {/* Desktop tabs */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-2">
            Espace Client
          </h1>
          <p className="text-cc-text-secondary mb-6">
            Rechargez, souscrivez à un forfait ou commandez un service en toute simplicité
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full mb-6 bg-cc-surface-container border border-cc-border ${isLoyalClient ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="recharger" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Zap className="w-4 h-4 mr-2" /> Recharger</TabsTrigger>
              <TabsTrigger value="historique" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Clock className="w-4 h-4 mr-2" /> Historique</TabsTrigger>
              {isLoyalClient && (
                <TabsTrigger value="tableau" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><BarChart3 className="w-4 h-4 mr-2" /> Mon Tableau</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="recharger">
              <UnifiedRechargeFlow userId={user?.id} cabineToken={cabineToken} />
            </TabsContent>
            <TabsContent value="historique">
              <ClientHistory userId={user?.id} />
            </TabsContent>
            {isLoyalClient && (
              <TabsContent value="tableau">
                <LoyaltyDashboard userId={user?.id} />
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>

      {/* Mobile content */}
      <div className="md:hidden max-w-[480px] mx-auto px-4 py-4">
        {activeTab === 'recharger' && <UnifiedRechargeFlow userId={user?.id} cabineToken={cabineToken} />}
        {activeTab === 'historique' && <ClientHistory userId={user?.id} />}
        {activeTab === 'tableau' && isLoyalClient && <LoyaltyDashboard userId={user?.id} />}
      </div>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-cc-border flex justify-around items-center px-2 pb-6 pt-2 max-w-[480px] mx-auto">
        {bottomNavItems.map(item => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleBottomNav(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-smooth ${
                isActive ? 'text-cc-blue' : 'text-cc-text-secondary'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_6px_rgba(37,99,235,0.5)]' : ''}`} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export function UnifiedRechargeFlow({ userId, cabineToken }: { userId?: string; cabineToken?: string | null }) {
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [detectedOperator, setDetectedOperator] = useState<string | null>(null)
  const [type, setType] = useState<'RECHARGE' | 'SUBSCRIPTION'>('RECHARGE')
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'WAVE' | 'DJAMO'>('DJAMO')
  const [plans, setPlans] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [cabineId, setCabineId] = useState<string | null>(null)

  // Transaction flow state
  const [transactionRef, setTransactionRef] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0) // 0=form, 1=validated, 2=payment pending, 3=processing, 4=completed
  const [loading, setLoading] = useState(false)
  const [confirmCountdown, setConfirmCountdown] = useState(0)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)

  // Fetch cabine info and plans
  useEffect(() => {
    if (cabineToken) {
      fetch(`/api/cabine/${cabineToken}`)
        .then(r => r.json())
        .then(data => { if (data.id) setCabineId(data.id) })
        .catch(() => {})
    }
    fetch('/api/subscription-plans')
      .then(r => { if (!r.ok) return []; return r.json() })
      .then(data => {
        setPlans(Array.isArray(data) ? data : [])
        setPlansLoading(false)
      })
      .catch(() => setPlansLoading(false))
  }, [cabineToken])

  // Security countdown timer
  useEffect(() => {
    if (confirmCountdown <= 0) return
    const timer = setInterval(() => {
      setConfirmCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [confirmCountdown])

  // Poll transaction status when processing
  useEffect(() => {
    if (!transactionRef || activeStep < 3) return
    const interval = setInterval(() => {
      fetch(`/api/transactions?reference=${transactionRef}`)
        .then(r => r.json())
        .then(data => {
          if (data.status === 'COMPLETED') {
            setTransactionStatus('COMPLETED')
            setActiveStep(4)
            clearInterval(interval)
          } else if (data.status === 'FAILED') {
            setTransactionStatus('FAILED')
            setActiveStep(-1) // error state
            clearInterval(interval)
          } else if (data.status === 'PROCESSING') {
            setTransactionStatus('PROCESSING')
          }
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [transactionRef, activeStep])

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    const op = detectOperator(value)
    setDetectedOperator(op !== 'UNKNOWN' ? op : null)
    // Reset selected plan if operator changed and type is subscription
    if (type === 'SUBSCRIPTION' && selectedPlan && op !== 'UNKNOWN' && selectedPlan.operator !== op) {
      setSelectedPlan(null)
    }
  }

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000]

  const filteredPlans = detectedOperator
    ? plans.filter(p => p.operator === detectedOperator)
    : plans

  const effectiveAmount = type === 'SUBSCRIPTION' && selectedPlan ? selectedPlan.amount : (amount ? parseInt(amount) : 0)

  const canSubmit = clientName.trim() && phone && effectiveAmount > 0 && (type === 'RECHARGE' || (type === 'SUBSCRIPTION' && selectedPlan))

  // Handle main CTA click - create transaction
  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          clientName: clientName.trim(),
          amount: effectiveAmount,
          paymentMethod,
          type,
          planName: type === 'SUBSCRIPTION' ? selectedPlan?.name : undefined,
          userId,
          cabineId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la création de la transaction')
        return
      }
      setTransactionRef(data.reference)
      setTransactionStatus(data.status)
      setActiveStep(1)

      // Open payment link in new tab
      const payLink = paymentMethod === 'WAVE' ? WAVE_PAY_LINK : DJAMO_PAY_LINK
      window.open(payLink, '_blank')

      // Auto-advance to step 2 after short delay
      setTimeout(() => {
        setActiveStep(2)
        setConfirmCountdown(10)
      }, 1500)
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Handle payment confirmation (step 2 -> step 3)
  const handlePaymentConfirmed = async () => {
    if (!transactionRef) return
    setLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: transactionRef,
          status: 'PAYMENT_CONFIRMED',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur de confirmation')
        return
      }
      setPaymentConfirmed(true)
      setActiveStep(3)
      setTransactionStatus('PROCESSING')
      toast.success('Paiement confirmé ! Recharge en cours...')
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Copy reference to clipboard
  const handleCopyRef = () => {
    if (transactionRef) {
      navigator.clipboard.writeText(transactionRef)
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2000)
      toast.success('Référence copiée !')
    }
  }

  // Reset form for new recharge
  const handleNewRecharge = () => {
    setClientName('')
    setPhone('')
    setAmount('')
    setDetectedOperator(null)
    setType('RECHARGE')
    setSelectedPlan(null)
    setPaymentMethod('DJAMO')
    setTransactionRef(null)
    setTransactionStatus(null)
    setActiveStep(0)
    setLoading(false)
    setConfirmCountdown(0)
    setPaymentConfirmed(false)
    setCopiedRef(false)
  }

  // ===================== RENDER =====================

  // Success screen (step 4)
  if (activeStep === 4) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-cc-surface-container border border-cc-border rounded-2xl p-6 text-center"
        >
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.6, delay: 0.3 }}
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-bold text-cc-text-primary mb-2"
          >
            Recharge effectuée ! 🎉
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-cc-text-secondary mb-6"
          >
            Votre transaction a été traitée avec succès
          </motion.p>

          {/* Transaction summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-cc-surface-container-high rounded-xl p-4 text-left space-y-3 mb-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-cc-text-secondary">Référence</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-cc-blue">{transactionRef}</span>
                <button onClick={handleCopyRef} className="p-1 hover:bg-cc-surface-container-highest rounded transition-smooth">
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-cc-text-secondary" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cc-text-secondary">Nom</span>
              <span className="text-sm text-cc-text-primary">{clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cc-text-secondary">Téléphone</span>
              <span className="text-sm text-cc-text-primary">{phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cc-text-secondary">Montant</span>
              <span className="text-sm font-bold text-cc-orange">{formatCurrency(effectiveAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cc-text-secondary">Opérateur</span>
              {detectedOperator && (
                <Badge className={`${OPERATOR_INFO[detectedOperator].bg} ${OPERATOR_INFO[detectedOperator].color} text-xs`}>
                  {OPERATOR_INFO[detectedOperator].name}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cc-text-secondary">Paiement</span>
              <span className="text-sm text-cc-text-primary">{paymentMethod === 'WAVE' ? 'Wave' : 'Djamo'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cc-text-secondary">Date</span>
              <span className="text-sm text-cc-text-primary">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </motion.div>

          <Button
            onClick={handleNewRecharge}
            className="w-full bg-gradient-to-r from-cc-orange to-orange-600 text-white h-11 btn-glow-orange"
          >
            <Zap className="w-4 h-4 mr-2" /> Nouvelle recharge
          </Button>
        </motion.div>
      </div>
    )
  }

  // Failed state
  if (activeStep === -1) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-cc-surface-container border border-red-500/20 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Transaction échouée</h3>
          <p className="text-sm text-cc-text-secondary mb-4">
            Votre transaction n&apos;a pas pu être traitée. Veuillez réessayer.
          </p>
          {transactionRef && (
            <p className="text-xs text-cc-text-secondary mb-4">Référence: <span className="font-mono text-cc-blue">{transactionRef}</span></p>
          )}
          <Button
            onClick={handleNewRecharge}
            className="w-full bg-gradient-to-r from-cc-orange to-orange-600 text-white h-11 btn-glow-orange"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
          </Button>
        </motion.div>
      </div>
    )
  }

  // Progress tracker view (steps 1-3)
  const renderProgressTracker = () => {
    const steps = [
      { num: 1, icon: Check, label: 'Informations validées', sub: null, completed: activeStep >= 2 },
      { num: 2, icon: CreditCard, label: 'Paiement en attente', sub: activeStep === 2 ? (confirmCountdown > 0 ? `Attendez ${confirmCountdown}s...` : 'Cochez pour confirmer') : null, completed: activeStep >= 3, active: activeStep === 2 },
      { num: 3, icon: RefreshCw, label: 'Recharge en cours', sub: activeStep === 3 ? 'Traitement automatique...' : null, completed: activeStep >= 4, active: activeStep === 3 },
      { num: 4, icon: CheckCircle, label: 'Recharge effectuée', sub: null, completed: activeStep >= 4 },
    ]

    return (
      <div className="space-y-0">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex gap-3">
            {/* Vertical connector + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                step.completed
                  ? 'bg-green-500 text-white'
                  : step.active
                    ? 'bg-cc-orange/20 border-2 border-cc-orange text-cc-orange'
                    : 'bg-cc-surface-container-high text-cc-text-secondary/50'
              }`}>
                {step.completed ? (
                  <Check className="w-4 h-4" />
                ) : step.active ? (
                  <step.icon className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{step.num}</span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-0.5 h-8 transition-all duration-500 ${
                  step.completed ? 'bg-green-500' : 'bg-cc-border'
                }`} />
              )}
            </div>
            {/* Content */}
            <div className="pb-6 flex-1">
              <p className={`text-sm font-medium ${
                step.completed ? 'text-green-400' : step.active ? 'text-cc-text-primary' : 'text-cc-text-secondary/50'
              }`}>
                {step.label}
              </p>
              {step.sub && (
                <p className={`text-xs mt-0.5 ${step.active ? 'text-cc-orange' : 'text-cc-text-secondary'}`}>
                  {step.sub}
                </p>
              )}
              {/* Active step pulsing dot */}
              {step.active && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-cc-orange mt-1"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Step 2-3: Payment + Progress tracker
  if (activeStep >= 1 && activeStep <= 3) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Card className="bg-cc-surface-container border border-cc-border rounded-2xl">
          <CardContent className="pt-6 space-y-5">
            {/* Reference display */}
            {transactionRef && (
              <div className="flex items-center justify-between bg-cc-blue/5 border border-cc-blue/10 rounded-xl p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-cc-text-secondary">Référence</p>
                  <p className="text-sm font-mono font-bold text-cc-blue">{transactionRef}</p>
                </div>
                <button onClick={handleCopyRef} className="p-2 hover:bg-cc-surface-container-highest rounded-lg transition-smooth">
                  {copiedRef ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-cc-blue" />}
                </button>
              </div>
            )}

            {/* Progress tracker */}
            {renderProgressTracker()}

            {/* Step 2: Payment confirmation section */}
            {activeStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 border border-cc-orange/20 rounded-2xl p-4 bg-orange-500/5"
              >
                {/* Payment link */}
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-cc-orange" />
                  <span className="font-semibold text-cc-text-primary">Effectuez le paiement</span>
                </div>
                <p className="text-sm text-cc-text-secondary">
                  Montant: <strong className="text-cc-orange">{formatCurrency(effectiveAmount)} FCFA</strong> via <strong className="text-cc-text-primary">{paymentMethod === 'WAVE' ? 'Wave' : 'Djamo'}</strong>
                </p>

                {/* Re-open payment link */}
                {paymentMethod === 'WAVE' ? (
                  <a
                    href={WAVE_PAY_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gradient-to-r from-cc-orange to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 transition-smooth"
                  >
                    <ExternalLink className="w-4 h-4" /> Ouvrir Wave Pay
                  </a>
                ) : (
                  <a
                    href={DJAMO_PAY_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 transition-smooth"
                  >
                    <Wallet className="w-4 h-4" /> Ouvrir Djamo Pay
                  </a>
                )}

                {/* Countdown */}
                {confirmCountdown > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <span className="text-xs text-yellow-400">Veuillez d&apos;abord effectuer le paiement... ({confirmCountdown}s)</span>
                  </div>
                )}

                {/* Payment confirmation checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmCountdown > 0) {
                        toast.error(`Veuillez attendre ${confirmCountdown}s avant de confirmer`)
                        return
                      }
                      handlePaymentConfirmed()
                    }}
                    disabled={confirmCountdown > 0 || loading}
                    className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-smooth ${
                      confirmCountdown > 0
                        ? 'border-cc-border opacity-30 cursor-not-allowed'
                        : loading
                          ? 'border-cc-orange/30 cursor-wait'
                          : 'border-cc-border hover:border-cc-orange/50 cursor-pointer'
                    }`}
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 text-cc-orange animate-spin" /> : null}
                  </button>
                  <span className="text-sm text-cc-text-secondary">
                    J&apos;ai effectué le paiement de {formatCurrency(effectiveAmount)} FCFA
                  </span>
                </div>

                {/* Fraud warning */}
                <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-red-400/80">⚠️ Tout faux signalement de paiement sera signalé et votre compte pourra être suspendu.</p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Processing spinner */}
            {activeStep === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <Loader2 className="w-8 h-8 text-cc-blue animate-spin" />
                <p className="text-sm text-cc-text-secondary">Votre recharge est en cours de traitement...</p>
                <p className="text-xs text-cc-text-secondary/60">Vérification automatique toutes les 5 secondes</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===================== STEP 0: FORM =====================
  return (
    <Card className="max-w-lg mx-auto bg-cc-surface-container border border-cc-border rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cc-text-primary">
          <Zap className="w-5 h-5 text-cc-orange" />
          Recharger ou souscrire
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Guide message */}
        <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-cc-blue/5 border border-cc-blue/10">
          <Info className="w-4 h-4 text-cc-blue mt-0.5 shrink-0" />
          <p className="text-xs text-cc-text-secondary">
            <strong className="text-cc-blue">Comment ça marche ?</strong> Entrez votre numéro, choisissez le montant ou forfait, payez via Wave ou Djamo, puis confirmez. C&apos;est tout !
          </p>
        </div>

        <div className="space-y-5">
          {/* Client name input */}
          <div className="space-y-2">
            <Label className="text-cc-text-secondary">Votre nom</Label>
            <Input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Entrez votre nom"
              required
              className="bg-cc-surface-container-high border-cc-border text-cc-text-primary placeholder:text-cc-text-secondary/50"
            />
          </div>

          {/* Phone number input */}
          <div className="space-y-2">
            <Label className="text-cc-text-secondary">Numéro de téléphone</Label>
            <div className="relative">
              <Input
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="07XX XXX XXX"
                required
                className={`bg-cc-surface-container-high text-cc-text-primary placeholder:text-cc-text-secondary/50 pr-24 ${
                  detectedOperator ? `border-2 ${
                    detectedOperator === 'ORANGE' ? 'border-orange-400' :
                    detectedOperator === 'MTN' ? 'border-yellow-400' :
                    'border-blue-500'
                  }` : 'border-cc-border'
                }`}
              />
              {detectedOperator && (
                <Badge className={`absolute right-2 top-1/2 -translate-y-1/2 ${OPERATOR_INFO[detectedOperator].bg} ${OPERATOR_INFO[detectedOperator].color}`}>
                  {OPERATOR_INFO[detectedOperator].name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-cc-text-secondary">07 = Orange, 01 = Moov, 04 = MTN</p>
          </div>

          {/* Type selector: Recharge or Subscription */}
          <div className="space-y-2">
            <Label className="text-cc-text-secondary">Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('RECHARGE'); setSelectedPlan(null) }}
                className={`p-3 rounded-xl border-2 text-center transition-smooth ${
                  type === 'RECHARGE'
                    ? 'border-cc-orange bg-cc-orange/10'
                    : 'border-cc-border bg-cc-surface-container-high hover:border-cc-orange/30'
                }`}
              >
                <div className="font-bold text-sm text-cc-text-primary mb-0.5">
                  <Phone className="w-4 h-4 inline mr-1" /> Recharge
                </div>
                <div className="text-[10px] text-cc-text-secondary">Montant libre</div>
              </button>
              <button
                type="button"
                onClick={() => { setType('SUBSCRIPTION'); setAmount('') }}
                className={`p-3 rounded-xl border-2 text-center transition-smooth ${
                  type === 'SUBSCRIPTION'
                    ? 'border-cc-blue bg-cc-blue/10'
                    : 'border-cc-border bg-cc-surface-container-high hover:border-cc-blue/30'
                }`}
              >
                <div className="font-bold text-sm text-cc-text-primary mb-0.5">
                  <CreditCard className="w-4 h-4 inline mr-1" /> Forfait
                </div>
                <div className="text-[10px] text-cc-text-secondary">Plans opérateurs</div>
              </button>
            </div>
          </div>

          {/* Amount input (for RECHARGE) */}
          {type === 'RECHARGE' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <Label className="text-cc-text-secondary">Montant (FCFA)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Entrez le montant" min="50" required className="bg-cc-surface-container-high border-cc-border text-cc-text-primary placeholder:text-cc-text-secondary/50" />
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map(a => (
                  <Button
                    key={a}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={amount === String(a) ? 'bg-cc-blue text-white border-cc-blue btn-glow' : 'border-cc-border text-cc-text-secondary hover:bg-cc-surface-container-highest hover:text-cc-text-primary'}
                    onClick={() => setAmount(String(a))}
                  >
                    {formatCurrency(a)}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Subscription plan grid (for SUBSCRIPTION) */}
          {type === 'SUBSCRIPTION' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <Label className="text-cc-text-secondary">Choisir un forfait {!detectedOperator && <span className="text-cc-text-secondary/60">(tous opérateurs)</span>}</Label>
              {plansLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-cc-surface-container-high animate-pulse" />
                  ))}
                </div>
              ) : filteredPlans.length === 0 ? (
                <p className="text-sm text-cc-text-secondary py-4 text-center">Aucun forfait disponible pour cet opérateur</p>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredPlans.map(plan => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`text-left p-4 rounded-xl border-2 transition-smooth overflow-hidden min-h-[60px] ${
                          selectedPlan?.id === plan.id
                            ? 'border-cc-blue bg-cc-blue/10'
                            : 'border-cc-border hover:border-cc-blue/30 bg-cc-surface-container-high'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${OPERATOR_INFO[plan.operator]?.bg} ${OPERATOR_INFO[plan.operator]?.color} text-xs`}>
                            {OPERATOR_INFO[plan.operator]?.name}
                          </Badge>
                          <span className="font-bold text-sm text-cc-text-primary">{formatCurrency(plan.amount)}</span>
                        </div>
                        <p className="text-sm font-medium text-cc-text-primary line-clamp-1">{plan.name}</p>
                        {plan.description && <p className="text-xs text-cc-text-secondary line-clamp-2">{plan.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Payment method selector */}
          <div className="space-y-2">
            <Label className="text-cc-text-secondary">Méthode de paiement</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('WAVE')}
                className={`p-3 rounded-xl border-2 text-center transition-smooth ${
                  paymentMethod === 'WAVE'
                    ? 'border-cc-orange bg-cc-orange/10'
                    : 'border-cc-border bg-cc-surface-container-high hover:border-cc-orange/30'
                }`}
              >
                <div className="font-bold text-sm text-cc-text-primary mb-0.5">Wave</div>
                <div className="text-[10px] text-cc-text-secondary">💻 Idéal ordinateur</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('DJAMO')}
                className={`p-3 rounded-xl border-2 text-center transition-smooth ${
                  paymentMethod === 'DJAMO'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-cc-border bg-cc-surface-container-high hover:border-green-500/30'
                }`}
              >
                <div className="font-bold text-sm text-cc-text-primary mb-0.5">Djamo</div>
                <div className="text-[10px] text-cc-text-secondary">📱 WAVE, Orange, MTN, Moov</div>
              </button>
            </div>
          </div>

          {/* Main CTA */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`w-full h-12 text-base font-bold ${
              canSubmit && !loading
                ? 'bg-gradient-to-r from-cc-orange to-orange-600 text-white btn-glow-orange'
                : 'bg-cc-orange/20 text-cc-text-secondary/40 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Traitement...</>
            ) : (
              <><Zap className="w-5 h-5 mr-2" /> Recharger ou souscrire</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ClientHistory({ userId }: { userId?: string }) {
  const [recharges, setRecharges] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('transactions')
  const { isLoyalClient } = useAppStore()

  useEffect(() => {
    const params = userId ? `?userId=${userId}` : ''
    let cancelled = false
    Promise.all([
      fetch(`/api/recharges${params}`).then(r => { if (!r.ok) return []; return r.json() }).then(d => Array.isArray(d) ? d : []).catch(() => []),
      fetch(`/api/subscriptions${params}`).then(r => { if (!r.ok) return []; return r.json() }).then(d => Array.isArray(d) ? d : []).catch(() => []),
      fetch(`/api/transactions${params}`).then(r => { if (!r.ok) return []; return r.json() }).then(d => Array.isArray(d) ? d : []).catch(() => []),
    ]).then(([r, s, t]) => {
      if (cancelled) return
      setRecharges(r)
      setSubscriptions(s)
      setTransactions(t)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [userId])

  const completedCount = recharges.filter((r: any) => r.status === 'COMPLETED').length + subscriptions.filter((s: any) => s.status === 'COMPLETED').length

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'PAYMENT_PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">En attente</Badge>
      case 'PAYMENT_CONFIRMED':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Confirmé</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">En cours</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Complété</Badge>
      case 'FAILED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Échoué</Badge>
      default:
        return <Badge className="bg-cc-surface-container-highest text-cc-text-secondary text-xs">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-xl bg-cc-surface-container animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Guide message */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-cc-yellow/5 border border-cc-yellow/10">
        <Info className="w-4 h-4 text-cc-yellow mt-0.5 shrink-0" />
        <p className="text-xs text-cc-text-secondary">
          <strong className="text-cc-yellow">Votre historique</strong> — Suivez ici toutes vos transactions, recharges et souscriptions. Effectuez 2 actions pour devenir Client Fidèle !
        </p>
      </div>

      {/* Loyalty progress banner */}
      {!isLoyalClient && (
        <Card className="bg-gradient-to-r from-cc-orange/10 to-cc-yellow/10 border border-cc-orange/20 rounded-2xl">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-cc-orange/20 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-cc-orange" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-cc-text-primary mb-1">Devenez Client Fidèle ⭐</p>
                <p className="text-xs text-cc-text-secondary mb-3">
                  Effectuez 2 actions pour devenir Client Fidèle et accéder à votre tableau de bord !
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-cc-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cc-orange to-cc-yellow rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((completedCount / 2) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-cc-orange">{completedCount}/2</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loyal client badge */}
      {isLoyalClient && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cc-yellow/10 to-cc-orange/10 border border-cc-yellow/20">
          <Star className="w-4 h-4 text-cc-yellow fill-cc-yellow" />
          <span className="text-sm font-medium text-cc-yellow">Client Fidèle ⭐</span>
          <span className="text-xs text-cc-text-secondary ml-auto">{completedCount} actions complétées</span>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 bg-cc-surface-container border border-cc-border">
          <TabsTrigger value="transactions" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white">Transactions</TabsTrigger>
          <TabsTrigger value="recharges" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white">Recharges</TabsTrigger>
          <TabsTrigger value="subscriptions" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white">Souscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          {transactions.length === 0 ? (
            <Card className="bg-cc-surface-container border border-cc-border"><CardContent className="py-8 text-center text-cc-text-secondary">
              <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucune transaction pour le moment</p>
            </CardContent></Card>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {transactions.map((t: any) => (
                  <Card key={t.id} className="glow-card bg-cc-surface-container border border-cc-border rounded-xl">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${OPERATOR_INFO[t.operator]?.bg || 'bg-gray-200'} flex items-center justify-center`}>
                          {t.type === 'RECHARGE' ? (
                            <Phone className={`w-5 h-5 ${OPERATOR_INFO[t.operator]?.color || 'text-gray-600'}`} />
                          ) : (
                            <CreditCard className={`w-5 h-5 ${OPERATOR_INFO[t.operator]?.color || 'text-gray-600'}`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-cc-text-primary">
                            {t.type === 'RECHARGE' ? 'Recharge' : t.planName || 'Forfait'}
                          </p>
                          <p className="text-xs text-cc-text-secondary">
                            <span className="font-mono text-cc-blue/60">{t.reference}</span>
                            {' · '}{maskPhone(t.phone)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-cc-text-primary">{formatCurrency(t.amount)}</p>
                        {getTransactionStatusBadge(t.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="recharges">
          {recharges.length === 0 ? (
            <Card className="bg-cc-surface-container border border-cc-border"><CardContent className="py-8 text-center text-cc-text-secondary">
              <Phone className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucune recharge pour le moment</p>
            </CardContent></Card>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {recharges.map((r: any) => (
                  <Card key={r.id} className="glow-card bg-cc-surface-container border border-cc-border rounded-xl">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${OPERATOR_INFO[r.operator]?.bg || 'bg-gray-200'} flex items-center justify-center`}>
                          <Phone className={`w-5 h-5 ${OPERATOR_INFO[r.operator]?.color || 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-cc-text-primary">{r.clientName}</p>
                          <p className="text-xs text-cc-text-secondary">{maskPhone(r.phone)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-cc-text-primary">{formatCurrency(r.amount)}</p>
                        <Badge variant={r.status === 'COMPLETED' ? 'default' : r.status === 'PENDING' ? 'secondary' : 'destructive'} className="text-xs">
                          {r.status === 'COMPLETED' ? 'Complété' : r.status === 'PENDING' ? 'En cours' : 'Échoué'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="subscriptions">
          {subscriptions.length === 0 ? (
            <Card className="bg-cc-surface-container border border-cc-border"><CardContent className="py-8 text-center text-cc-text-secondary">
              <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucune souscription pour le moment</p>
            </CardContent></Card>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {subscriptions.map((s: any) => (
                  <Card key={s.id} className="glow-card bg-cc-surface-container border border-cc-border rounded-xl">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${OPERATOR_INFO[s.operator]?.bg || 'bg-gray-200'} flex items-center justify-center`}>
                          <CreditCard className={`w-5 h-5 ${OPERATOR_INFO[s.operator]?.color || 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-cc-text-primary">{s.planName}</p>
                          <p className="text-xs text-cc-text-secondary">{s.clientName} — {maskPhone(s.phone)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-cc-text-primary">{formatCurrency(s.amount)}</p>
                        <Badge variant={s.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
                          {s.status === 'COMPLETED' ? 'Complété' : 'En cours'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


