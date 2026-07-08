'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Star, Gift, Award, Crown, Medal, Zap,
  Copy, RefreshCw, Users, Loader2, Sparkles, Target,
  Phone, CreditCard, Package, ChevronDown, ChevronUp,
  X, Plus, Check, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/commissions'

// ==========================================
// ADMIN LOYALTY MANAGEMENT
// ==========================================

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; threshold: number; promoAmount: number }> = {
  NONE: { label: 'Nouveau', icon: '🌱', color: 'text-gray-500', bg: 'bg-gray-500/10', threshold: 0, promoAmount: 0 },
  BRONZE: { label: 'Bronze', icon: '🥉', color: 'text-amber-700', bg: 'bg-amber-700/10', threshold: 5, promoAmount: 0 },
  SILVER: { label: 'Argent', icon: '🥈', color: 'text-gray-400', bg: 'bg-gray-400/10', threshold: 25, promoAmount: 5000 },
  GOLD: { label: 'Or', icon: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-500/10', threshold: 50, promoAmount: 10000 },
  PLATINUM: { label: 'Platine', icon: '💎', color: 'text-purple-500', bg: 'bg-purple-500/10', threshold: 100, promoAmount: 25000 },
}

const CASHBACK_TIERS = [
  { ops: 5, reward: 'Tableau de bord fidèle + Badge Bronze', cashback: 0, icon: '🥉' },
  { ops: 25, reward: 'Cashback 5 000 F', cashback: 5000, icon: '🥈' },
  { ops: 50, reward: 'Cashback 10 000 F', cashback: 10000, icon: '🥇' },
  { ops: 100, reward: 'Cashback 25 000 F', cashback: 25000, icon: '💎' },
]

export function AdminLoyalty() {
  const [stats, setStats] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clientDetail, setClientDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantAmount, setGrantAmount] = useState(5000)
  const [grantUserId, setGrantUserId] = useState('')
  const [granting, setGranting] = useState(false)
  const [recalculating, setRecalculating] = useState<string | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)
  const [reportResult, setReportResult] = useState<any>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, clientsRes] = await Promise.all([
        fetch('/api/admin/loyalty?action=stats'),
        fetch('/api/admin/loyalty?action=clients'),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (clientsRes.ok) setClients(await clientsRes.json())
    } catch (err) {
      console.error('Load loyalty error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleViewDetail = async (client: any) => {
    if (selectedClient?.id === client.id) {
      setSelectedClient(null)
      setClientDetail(null)
      return
    }
    setSelectedClient(client)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/loyalty?action=client-detail&clientId=${client.id}`)
      if (res.ok) {
        setClientDetail(await res.json())
      }
    } catch (err) {
      console.error('Client detail error:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setReportGenerating(true)
    setReportResult(null)
    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-recalculate' }),
      })
      const data = await res.json()
      if (res.ok) {
        setReportResult(data)
        loadData()
        toast.success(`Rapport généré : ${data.updated} client(s) mis à jour sur ${data.total}`)
      } else {
        toast.error(data.error || 'Erreur de génération du rapport')
      }
    } catch {
      toast.error('Erreur de génération du rapport')
    } finally {
      setReportGenerating(false)
    }
  }

  const handleRecalculate = async (userId: string) => {
    setRecalculating(userId)
    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculate', userId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Fidélité recalculée : ${data.previousTier} → ${data.currentTier} (${data.totalQualifyingOps} ops)`)
        loadData()
      } else {
        toast.error(data.error || 'Erreur de recalcul')
      }
    } catch {
      toast.error('Erreur de recalcul')
    } finally {
      setRecalculating(null)
    }
  }

  const handleGrantPromo = async () => {
    if (!grantUserId || !grantAmount) return
    setGranting(true)
    const targetUserId = grantUserId // capture before clearing
    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grant-promo', userId: targetUserId, amount: grantAmount }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Code promo ${data.code} créé pour ${formatCurrency(grantAmount)}`)
        setShowGrantModal(false)
        setGrantAmount(5000)
        setGrantUserId('')
        loadData()
        // Refresh detail if viewing this client
        if (selectedClient?.id === targetUserId) {
          handleViewDetail(selectedClient)
        }
      } else {
        toast.error(data.error || 'Erreur création code promo')
      }
    } catch {
      toast.error('Erreur création code promo')
    } finally {
      setGranting(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copié !')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-xl bg-[#1a1a1a] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Clients" value={stats?.totalClients || 0} color="text-blue-400" />
        <StatCard icon={<Trophy className="w-5 h-5" />} label="Clients Fidèles" value={stats?.loyalClients || 0} color="text-amber-400" />
        <StatCard icon={<Gift className="w-5 h-5" />} label="Codes Actifs" value={stats?.activePromoCodes || 0} color="text-green-400" />
        <StatCard icon={<Medal className="w-5 h-5" />} label="Valeur Promo" value={formatCurrency(stats?.totalPromoValue || 0)} color="text-purple-400" />
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TierCard tier="BRONZE" count={stats?.bronzeClients || 0} />
        <TierCard tier="SILVER" count={stats?.silverClients || 0} />
        <TierCard tier="GOLD" count={stats?.goldClients || 0} />
        <TierCard tier="PLATINUM" count={stats?.platinumClients || 0} />
      </div>

      {/* Cashback tiers explanation */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" />
            Paliers de récompense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CASHBACK_TIERS.map((tier) => (
              <div key={tier.ops} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                <span className="text-lg">{tier.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">{tier.ops} opérations</span>
                  <span className="text-xs text-[#a89080] ml-2">— {tier.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clients list */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Clients fidèles ({clients.length})
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleGenerateReport}
            disabled={reportGenerating}
            className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
          >
            {reportGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Rapport
          </Button>
          <Button
            size="sm"
            onClick={loadData}
            className="bg-white/5 border border-white/[0.06] text-[#a89080] hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Report result */}
      {reportResult && (
        <Card className="bg-[#111] border border-orange-500/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-white">Rapport de fidélité</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                <p className="text-lg font-bold text-white">{reportResult.total}</p>
                <p className="text-[10px] text-[#a89080]">Clients analysés</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/5 text-center">
                <p className="text-lg font-bold text-green-400">{reportResult.updated}</p>
                <p className="text-[10px] text-[#a89080]">Mis à jour</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/5 text-center">
                <p className="text-lg font-bold text-orange-400">{reportResult.tierChanges}</p>
                <p className="text-[10px] text-[#a89080]">Changements de rang</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/5 text-center">
                <p className="text-lg font-bold text-purple-400">{reportResult.newPromoCodes}</p>
                <p className="text-[10px] text-[#a89080]">Nouveaux codes promo</p>
              </div>
            </div>
            {reportResult.details && reportResult.details.length > 0 && (
              <div className="mt-3 space-y-1">
                {reportResult.details.slice(0, 5).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-xs text-[#a89080]">{d.name}</span>
                    <span className="text-xs text-white font-medium">{d.previousTier} → {d.currentTier}</span>
                    {d.promoGenerated && <Badge className="bg-green-500/10 text-green-400 text-[8px] border-0">+code promo</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {clients.length === 0 ? (
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-[#a89080]/30 mb-3" />
            <p className="text-[#a89080]">Aucun client fidèle pour le moment</p>
            <p className="text-xs text-[#a89080]/50 mt-1">Les clients apparaîtront ici dès qu&apos;ils atteignent 5 opérations de 5 000F+</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => {
            const tierInfo = TIER_CONFIG[client.loyaltyTier] || TIER_CONFIG.NONE
            const isSelected = selectedClient?.id === client.id

            return (
              <div key={client.id} className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#111]">
                {/* Client row */}
                <button
                  onClick={() => handleViewDetail(client)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${tierInfo.bg}`}>
                    {tierInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm truncate">{client.name}</span>
                      <Badge className={`${tierInfo.bg} ${tierInfo.color} text-[9px] px-1.5 py-0 h-4 border-0`}>
                        {tierInfo.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#a89080] truncate">{client.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{client.totalQualifyingOps} ops</p>
                    <p className="text-xs text-[#a89080]">{formatCurrency(client.totalSpent)}</p>
                  </div>
                  <div className="shrink-0 ml-1">
                    {isSelected ? (
                      <ChevronUp className="w-4 h-4 text-[#a89080]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#a89080]" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.06] p-4 space-y-4">
                        {detailLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-[#a89080]" />
                          </div>
                        ) : clientDetail ? (
                          <>
                            {/* Breakdown */}
                            <div className="grid grid-cols-4 gap-2">
                              <MiniStat label="Recharges" value={client.totalQualifyingOps > 0 ? client.breakdown?.recharges || 0 : 0} icon={<Phone className="w-3 h-3" />} />
                              <MiniStat label="Forfaits" value={client.totalQualifyingOps > 0 ? client.breakdown?.subscriptions || 0 : 0} icon={<Zap className="w-3 h-3" />} />
                              <MiniStat label="Flash" value={client.totalQualifyingOps > 0 ? client.breakdown?.flashOrders || 0 : 0} icon={<Package className="w-3 h-3" />} />
                              <MiniStat label="Cartes" value={client.totalQualifyingOps > 0 ? client.breakdown?.physicalCards || 0 : 0} icon={<CreditCard className="w-3 h-3" />} />
                            </div>

                            {/* Progress to next tier */}
                            {(() => {
                              const ops = client.totalQualifyingOps
                              const tierOrder = ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const
                              const currentIdx = tierOrder.indexOf((client.loyaltyTier as any) || 'NONE')
                              const nextTierKey = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null
                              const nextTierCfg = nextTierKey ? TIER_CONFIG[nextTierKey] : null
                              const progress = nextTierCfg ? Math.min(100, (ops / nextTierCfg.threshold) * 100) : 100
                              const opsNeeded = nextTierCfg ? nextTierCfg.threshold - ops : 0

                              return nextTierCfg ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-[#a89080]">Progression vers {nextTierCfg.icon} {nextTierCfg.label}</span>
                                    <span className="text-white font-bold">{ops}/{nextTierCfg.threshold}</span>
                                  </div>
                                  <Progress value={progress} className="h-2 bg-white/[0.06]" />
                                  <p className="text-[10px] text-[#a89080]">Encore {opsNeeded} opération{opsNeeded > 1 ? 's' : ''}</p>
                                </div>
                              ) : (
                                <div className="text-center text-xs text-purple-400">
                                  💎 Rang maximum atteint !
                                </div>
                              )
                            })()}

                            {/* Promo codes */}
                            {client.promoCodes && client.promoCodes.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-white flex items-center gap-1">
                                  <Gift className="w-3 h-3 text-orange-500" /> Codes promo
                                </p>
                                {client.promoCodes.map((promo: any) => (
                                  <div key={promo.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                                    <code className="text-xs font-mono text-white font-bold">{promo.code}</code>
                                    <span className="text-xs text-[#a89080]">{formatCurrency(promo.amount)}</span>
                                    {promo.status === 'ACTIVE' ? (
                                      <Badge className="bg-green-500/10 text-green-400 text-[9px] border-0">Actif</Badge>
                                    ) : (
                                      <Badge className="bg-gray-500/10 text-gray-400 text-[9px] border-0">Utilisé</Badge>
                                    )}
                                    {promo.status === 'ACTIVE' && (
                                      <button onClick={() => handleCopyCode(promo.code)} className="p-1 rounded hover:bg-white/5 transition-colors">
                                        <Copy className="w-3 h-3 text-[#a89080]" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Operation history */}
                            {clientDetail.history && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-white flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-orange-500" /> Historique des opérations
                                </p>
                                <ScrollArea className="max-h-48">
                                  <div className="space-y-1">
                                    {[
                                      ...clientDetail.history.recharges?.map((r: any) => ({ ...r, type: 'RECHARGE', name: `Recharge ${r.operator}` })) || [],
                                      ...clientDetail.history.subscriptions?.map((s: any) => ({ ...s, type: 'SUBSCRIPTION', name: s.planName || `Forfait ${s.operator}` })) || [],
                                      ...clientDetail.history.flashOrders?.map((f: any) => ({ ...f, type: 'FLASH_ORDER', name: f.product?.name || 'Produit Flash' })) || [],
                                      ...clientDetail.history.physicalCards?.map((p: any) => ({ ...p, type: 'PHYSICAL_CARD', name: p.cardName || 'Carte physique' })) || [],
                                    ]
                                      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                      .slice(0, 20)
                                      .map((op: any, idx: number) => {
                                        const TypeIcon = op.type === 'RECHARGE' ? Phone :
                                          op.type === 'SUBSCRIPTION' ? Zap :
                                          op.type === 'FLASH_ORDER' ? Package : CreditCard
                                        const isQualifying = op.amount >= 5000
                                        return (
                                          <div key={`${op.id}-${idx}`} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                                            <TypeIcon className="w-3 h-3 text-[#a89080]" />
                                            <span className="text-xs text-white flex-1 truncate">{op.name}</span>
                                            <span className="text-xs text-white font-medium">{formatCurrency(op.amount)}</span>
                                            {isQualifying && (
                                              <Badge className="bg-green-500/10 text-green-400 text-[8px] border-0 px-1 py-0">✓</Badge>
                                            )}
                                            <span className="text-[10px] text-[#a89080]">
                                              {new Date(op.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                          </div>
                                        )
                                      })}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleRecalculate(client.id)}
                                disabled={recalculating === client.id}
                                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 h-8 text-xs"
                              >
                                {recalculating === client.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                                Recalculer
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => { setGrantUserId(client.id); setGrantAmount(5000); setShowGrantModal(true) }}
                                className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 h-8 text-xs"
                              >
                                <Gift className="w-3 h-3 mr-1" />
                                Accorder code promo
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-[#a89080] text-center py-4">Impossible de charger les détails</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Grant Promo Modal */}
      <AnimatePresence>
        {showGrantModal && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGrantModal(false)}
          >
            <motion.div
              className="w-full max-w-sm mx-4 p-6 rounded-2xl shadow-2xl border border-white/[0.06]"
              style={{ backgroundColor: '#1a1a1a' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-500" />
                  Accorder un code promo
                </h3>
                <button onClick={() => setShowGrantModal(false)} className="p-1 rounded hover:bg-white/5">
                  <X className="w-4 h-4 text-[#a89080]" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-[#a89080]">Montant du cashback</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5000, 10000, 25000, 50000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setGrantAmount(amount)}
                        className={`p-2 rounded-lg text-center text-xs font-medium transition-all ${
                          grantAmount === amount
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-white/[0.03] text-[#a89080] border border-white/[0.06] hover:bg-white/[0.06]'
                        }`}
                      >
                        {amount >= 1000 ? `${amount / 1000}K` : amount} F
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-[#a89080]">Montant personnalisé</Label>
                  <Input
                    type="number"
                    value={grantAmount}
                    onChange={e => setGrantAmount(Number(e.target.value))}
                    className="bg-white/[0.03] border-white/[0.06] text-white h-10"
                    min={500}
                    step={500}
                  />
                </div>

                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <p className="text-xs text-orange-400">
                    💡 Le client pourra utiliser ce code promo lors de son prochain achat pour une réduction de {formatCurrency(grantAmount)}.
                  </p>
                </div>

                <Button
                  onClick={handleGrantPromo}
                  disabled={granting || grantAmount <= 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold h-11 hover:from-orange-600 hover:to-orange-700"
                >
                  {granting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Créer le code promo - {formatCurrency(grantAmount)}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className="bg-[#111] border-white/[0.06]">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`${color}`}>{icon}</div>
          <span className="text-[10px] text-[#a89080] uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  )
}

function TierCard({ tier, count }: { tier: string; count: number }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <Card className="bg-[#111] border-white/[0.06]">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${cfg.bg}`}>
          {cfg.icon}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{count}</p>
          <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="p-2 rounded-lg bg-white/[0.02] text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-[10px] text-[#a89080]">{label}</span>
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}


