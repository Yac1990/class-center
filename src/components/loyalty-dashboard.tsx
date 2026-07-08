'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Star, Gift, Award, Crown, Medal, Zap,
  Copy, Check, Clock, TrendingUp, Package, CreditCard,
  Phone, ChevronRight, Loader2, Sparkles, Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/commissions'

// ==========================================
// LOYALTY DASHBOARD
// Badges, Promo Codes, Operation History
// ==========================================

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; threshold: number }> = {
  NONE: { label: 'Nouveau', icon: '🌱', color: 'text-gray-500', bg: 'bg-gray-500/10', threshold: 0 },
  BRONZE: { label: 'Bronze', icon: '🥉', color: 'text-amber-700', bg: 'bg-amber-700/10', threshold: 5 },
  SILVER: { label: 'Argent', icon: '🥈', color: 'text-gray-400', bg: 'bg-gray-400/10', threshold: 25 },
  GOLD: { label: 'Or', icon: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-500/10', threshold: 50 },
  PLATINUM: { label: 'Platine', icon: '💎', color: 'text-purple-500', bg: 'bg-purple-500/10', threshold: 100 },
}

const CASHBACK_TIERS = [
  { ops: 5, reward: 'Tableau de bord fidèle + Badge Bronze', cashback: 0, icon: '🥉' },
  { ops: 25, reward: 'Cashback 5 000 F', cashback: 5000, icon: '🥈' },
  { ops: 50, reward: 'Cashback 10 000 F', cashback: 10000, icon: '🥇' },
  { ops: 100, reward: 'Cashback 25 000 F', cashback: 25000, icon: '💎' },
]

export function LoyaltyDashboard({ userId }: { userId?: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCongratulations, setShowCongratulations] = useState(false)
  const { user, setUser } = useAppStore()

  useEffect(() => {
    if (userId) {
      fetchLoyalty()
    }
  }, [userId])

  const fetchLoyalty = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/loyalty?userId=${userId}`)
      if (res.ok) {
        const loyaltyData = await res.json()
        setData(loyaltyData)

        // Update user state with loyalty info
        if (loyaltyData.user) {
          const currentUser = useAppStore.getState().user
          if (currentUser) {
            useAppStore.getState().setUser({
              ...currentUser,
              isLoyal: loyaltyData.user.isLoyal,
              actionCount: loyaltyData.user.actionCount,
              loyaltyTier: loyaltyData.user.loyaltyTier,
            })
          }
        }

        // Check if we should show congratulations
        const lastSeen = typeof window !== 'undefined' ? localStorage.getItem(`loyalty-seen-${userId}`) : null
        const currentTier = loyaltyData.user?.loyaltyTier || 'NONE'
        if (lastSeen !== currentTier && currentTier !== 'NONE') {
          setShowCongratulations(true)
          if (typeof window !== 'undefined') localStorage.setItem(`loyalty-seen-${userId}`, currentTier)
        }
      }
    } catch (err) {
      console.error('Loyalty fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copié !')
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-xl bg-cc-surface-container animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-cc-text-secondary">Impossible de charger les données de fidélité</p>
      </div>
    )
  }

  const loyalty = data.loyalty || {}
  const loyaltyTier = data.user?.loyaltyTier || 'NONE'
  const qualifyingOps = loyalty.qualifyingOpsCount || 0
  const totalSpent = data.totalSpent || 0
  const promoCodes = data.promoCodes || []
  const badges = data.badges || []
  const nextTier = loyalty.nextTier
  const tier = TIER_CONFIG[loyaltyTier] || TIER_CONFIG.NONE
  const nextTierConfig = nextTier ? TIER_CONFIG[nextTier.tier] : null
  const progressToNext = nextTierConfig
    ? Math.min(100, (qualifyingOps / nextTierConfig.threshold) * 100)
    : 100
  const opsToNextTier = nextTier?.opsNeeded || 0

  // Build operation history from all types
  const allOps: Array<{ id: string; type: string; name: string; amount: number; date: string }> = []
  const history = data.history || {}
  if (history.recharges) {
    history.recharges.forEach((r: any) => {
      allOps.push({ id: r.id, type: 'RECHARGE', name: `Recharge ${r.operator}`, amount: r.amount, date: r.createdAt })
    })
  }
  if (history.subscriptions) {
    history.subscriptions.forEach((s: any) => {
      allOps.push({ id: s.id, type: 'SUBSCRIPTION', name: s.planName || `Forfait ${s.operator}`, amount: s.amount, date: s.createdAt })
    })
  }
  if (history.flashOrders) {
    history.flashOrders.forEach((f: any) => {
      allOps.push({ id: f.id, type: 'FLASH_ORDER', name: f.product?.name || 'Produit Flash', amount: f.amount, date: f.createdAt })
    })
  }
  if (history.physicalCards) {
    history.physicalCards.forEach((p: any) => {
      allOps.push({ id: p.id, type: 'PHYSICAL_CARD', name: p.cardName || 'Carte physique', amount: p.amount, date: p.createdAt })
    })
  }
  // Sort by date descending
  allOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Congratulations Modal */}
      <AnimatePresence>
        {showCongratulations && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-w-sm mx-4 p-8 rounded-3xl text-center shadow-2xl"
              style={{ backgroundColor: 'var(--cc-surface-container)' }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {tier.icon}
              </motion.div>
              <h2 className="text-2xl font-black mb-2 gradient-text">
                Félicitations {data.user?.name} ! 🎉
              </h2>
              <p className="text-cc-text-secondary mb-4">
                Vous avez atteint le rang <strong className={tier.color}>{tier.label}</strong> !
                {loyaltyTier === 'BRONZE' && ' Votre tableau de bord fidèle est maintenant débloqué.'}
                {loyaltyTier === 'SILVER' && ' Un code promo de 5 000 F vous attend !'}
                {loyaltyTier === 'GOLD' && ' Un code promo de 10 000 F vous attend !'}
                {loyaltyTier === 'PLATINUM' && ' Un code promo de 25 000 F vous attend !'}
              </p>
              <Button
                onClick={() => setShowCongratulations(false)}
                className="bg-cc-orange hover:bg-orange-600 text-white px-8"
              >
                Merci ! 🎉
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className={`relative p-6 ${tier.bg}`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cc-orange/30" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-cc-orange/20" />
          </div>

          <div className="relative flex items-center gap-4">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
              style={{ backgroundColor: 'var(--cc-surface-container)' }}
              animate={loyaltyTier !== 'NONE' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {tier.icon}
            </motion.div>
            <div className="flex-1">
              <p className="text-sm text-cc-text-secondary">Votre rang</p>
              <h2 className={`text-2xl font-black ${tier.color}`}>{tier.label}</h2>
              <p className="text-xs text-cc-text-secondary mt-0.5">
                {qualifyingOps} opération{qualifyingOps > 1 ? 's' : ''} qualifiante{qualifyingOps > 1 ? 's' : ''} (+5 000F)
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-cc-text-secondary">Total dépensé</p>
              <p className="text-lg font-bold gradient-text">{formatCurrency(totalSpent)}</p>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTierConfig && (
            <div className="relative mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cc-text-secondary">
                  Progression vers {nextTierConfig.icon} {nextTierConfig.label}
                </span>
                <span className="font-bold text-cc-text-primary">
                  {qualifyingOps}/{nextTierConfig.threshold}
                </span>
              </div>
              <Progress value={progressToNext} className="h-2.5 bg-cc-surface-container-high" />
              <p className="text-[10px] text-cc-text-secondary mt-1">
                Encore {opsToNextTier} opération{opsToNextTier > 1 ? 's' : ''} pour le prochain palier
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Cashback Tiers */}
      <Card className="border-cc-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-cc-text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-cc-orange" />
            Paliers de récompense
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CASHBACK_TIERS.map((tierInfo) => {
            const achieved = qualifyingOps >= tierInfo.ops
            return (
              <div
                key={tierInfo.ops}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  achieved ? 'bg-green-500/5 border border-green-500/20' : 'bg-cc-surface-container-high/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  achieved ? 'bg-green-500/10' : 'bg-cc-surface-container-high'
                }`}>
                  {achieved ? '✅' : tierInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${achieved ? 'text-green-700 dark:text-green-400' : 'text-cc-text-primary'}`}>
                    {tierInfo.ops} opérations
                  </p>
                  <p className="text-xs text-cc-text-secondary">{tierInfo.reward}</p>
                </div>
                {achieved && (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-[10px]">
                    Atteint
                  </Badge>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Promo Codes */}
      {promoCodes.length > 0 && (
        <Card className="border-cc-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-cc-text-primary flex items-center gap-2">
              <Gift className="w-4 h-4 text-cc-orange" />
              Mes codes promo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {promoCodes.map((promo: any) => (
              <div
                key={promo.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  promo.status === 'ACTIVE'
                    ? 'border-cc-orange/30 bg-orange-500/5'
                    : 'border-cc-border bg-cc-surface-container-high/30'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-cc-orange/10 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-cc-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold text-cc-text-primary font-mono">{promo.code}</code>
                    {promo.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="p-1 rounded hover:bg-cc-surface-container-high transition-colors"
                        title="Copier le code"
                      >
                        <Copy className="w-3.5 h-3.5 text-cc-text-secondary" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-cc-text-secondary">
                    Cashback de {formatCurrency(promo.amount)}
                    {promo.status === 'USED' && ' • Utilisé'}
                  </p>
                </div>
                <Badge className={
                  promo.status === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-[10px]'
                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20 text-[10px]'
                }>
                  {promo.status === 'ACTIVE' ? 'Actif' : 'Utilisé'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Operation History */}
      {allOps.length > 0 && (
        <Card className="border-cc-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-cc-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-cc-orange" />
              Historique des opérations qualifiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {allOps.map((op) => {
                  const TypeIcon = op.type === 'RECHARGE' ? Phone :
                    op.type === 'SUBSCRIPTION' ? Zap :
                    op.type === 'FLASH_ORDER' ? Package : CreditCard
                  return (
                    <div
                      key={op.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-cc-surface-container-high/50"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cc-surface-container flex items-center justify-center shrink-0">
                        <TypeIcon className="w-4 h-4 text-cc-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cc-text-primary truncate">{op.name}</p>
                        <p className="text-[11px] text-cc-text-secondary">
                          {new Date(op.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-cc-text-primary">{formatCurrency(op.amount)}</p>
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-[9px]">
                          ✓ Qualifié
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Info box */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
          💡 <strong>Comment ça marche ?</strong> Chaque opération de plus de 5 000 F (recharge, souscription, achat de carte ou produit flash) compte comme une opération qualifiante.
          À 5 opérations, vous débloquez ce tableau de bord. À 25, 50 et 100 opérations, vous recevez des codes promo cashback utilisables directement sur le site !
        </p>
      </div>
    </div>
  )
}
