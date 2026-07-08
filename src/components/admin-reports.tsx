'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, TrendingUp, TrendingDown, Phone, CreditCard,
  ShoppingCart, BarChart3, ArrowUpRight, ArrowDownRight,
  RefreshCw, Wallet, CheckCircle, Clock, XCircle,
  ChevronLeft, ChevronRight, Download, Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/commissions'
import { OPERATOR_INFO } from '@/lib/constants'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface ReportData {
  period: string
  periodType: string
  dateRange: { start: string; end: string }
  summary: {
    totalOperations: number
    totalAmount: number
    totalCommission: number
    completedOperations: number
    completedAmount: number
    completedCommission: number
    opsVariation: number
    amountVariation: number
  }
  byType: {
    RECHARGE: { count: number; amount: number; commission: number; completed: number; completedAmount: number }
    SUBSCRIPTION: { count: number; amount: number; commission: number; completed: number; completedAmount: number }
    PHYSICAL_CARD: { count: number; amount: number; commission: number; completed: number; completedAmount: number }
  }
  byOperator: Record<string, { count: number; amount: number; completed: number }>
  byPaymentMethod: Record<string, { count: number; amount: number }>
  byStatus: Record<string, number>
  dailyBreakdown: { date: string; count: number; amount: number; commission: number }[]
  cardSalesDetail: any[]
  topSellingCards: { name: string; count: number; amount: number }[]
  loyalty: {
    totalClients: number
    loyalClients: number
    newLoyalClients: number
    activePromoCodes: number
    usedPromoCodes: number
    totalPromoValue: number
    usedPromoValue: number
    promosUsedInPeriod: number
  }
  transactions: any[]
}

// ==========================================
// MINI BAR CHART (pure CSS, no library)
// ==========================================
function MiniBarChart({ data, maxValue, colorClass }: { data: number[]; maxValue: number; colorClass: string }) {
  return (
    <div className="flex items-end gap-[2px] h-16 w-full">
      {data.map((val, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm ${colorClass} transition-all duration-500`}
          style={{ height: maxValue > 0 ? `${Math.max((val / maxValue) * 100, 2)}%` : '2%' }}
        />
      ))}
    </div>
  )
}

// ==========================================
// VARIATION BADGE
// ==========================================
function VariationBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-[#a89080]">—</span>
  const isUp = value > 0
  return (
    <div className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </div>
  )
}

// ==========================================
// TYPE ICON
// ==========================================
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'RECHARGE': return <Phone className="w-4 h-4 text-primary-glow" />
    case 'SUBSCRIPTION': return <CreditCard className="w-4 h-4 text-secondary-dim" />
    case 'PHYSICAL_CARD': return <ShoppingCart className="w-4 h-4 text-cc-orange" />
    default: return <BarChart3 className="w-4 h-4 text-[#a89080]" />
  }
}

function TypeLabel({ type }: { type: string }) {
  switch (type) {
    case 'RECHARGE': return 'Recharge'
    case 'SUBSCRIPTION': return 'Souscription'
    case 'PHYSICAL_CARD': return 'Carte Physique'
    default: return type
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; className: string; label: string }> = {
    COMPLETED: { icon: CheckCircle, className: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Complété' },
    PAYMENT_CONFIRMED: { icon: CheckCircle, className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Payé' },
    PAYMENT_PENDING: { icon: Clock, className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'En attente' },
    PROCESSING: { icon: RefreshCw, className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'En cours' },
    FAILED: { icon: XCircle, className: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Échoué' },
    PENDING: { icon: Clock, className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'En attente' },
  }
  const c = config[status] || config.PENDING
  const Icon = c.icon
  return (
    <Badge className={`${c.className} text-[10px] border`}>
      <Icon className="w-3 h-3 mr-1" />
      {c.label}
    </Badge>
  )
}

// ==========================================
// MAIN REPORTS COMPONENT
// ==========================================
export function AdminReports() {
  const [period, setPeriod] = useState<Period>('daily')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadReport = () => {
    setLoading(true)
    fetch(`/api/reports?period=${period}&date=${date}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/reports?period=${period}&date=${date}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.error) setData(d)
        setLoading(false)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setLoading(false)
      })
    return () => controller.abort()
  }, [period, date])

  // Navigate between periods
  const navigatePeriod = (direction: -1 | 1) => {
    const d = new Date(date)
    switch (period) {
      case 'daily': d.setDate(d.getDate() + direction); break
      case 'weekly': d.setDate(d.getDate() + 7 * direction); break
      case 'monthly': d.setMonth(d.getMonth() + direction); break
      case 'yearly': d.setFullYear(d.getFullYear() + direction); break
    }
    setDate(d.toISOString().split('T')[0])
  }

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Référence', 'Type', 'Opérateur', 'Montant', 'Commission', 'Méthode', 'Statut', 'Date'],
      ...data.transactions.map(t => [
        t.reference,
        t.type,
        t.operator,
        t.amount,
        t.commission,
        t.paymentMethod,
        t.status,
        new Date(t.createdAt).toLocaleString('fr-FR'),
      ]),
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-${period}-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-[#1a1a1a] animate-pulse" />)}
        </div>
        <div className="h-64 rounded-xl bg-[#1a1a1a] animate-pulse" />
      </div>
    )
  }

  const s = data.summary
  const maxDailyAmount = Math.max(...data.dailyBreakdown.map(d => d.amount), 1)
  const maxDailyCount = Math.max(...data.dailyBreakdown.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Period Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="bg-[#1a1a1a] border border-white/[0.06]">
            <TabsTrigger value="daily" className="data-[state=active]:bg-cc-orange data-[state=active]:text-white text-xs">Journalier</TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-cc-orange data-[state=active]:text-white text-xs">Hebdomadaire</TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-cc-orange data-[state=active]:text-white text-xs">Mensuel</TabsTrigger>
            <TabsTrigger value="yearly" className="data-[state=active]:bg-cc-orange data-[state=active]:text-white text-xs">Annuel</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={() => navigatePeriod(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 bg-[#1a1a1a] border-white/[0.06] text-[#e5e2e1] text-sm w-[150px]"
          />
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={() => navigatePeriod(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={loadReport}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Actualiser
          </Button>
          <Button size="sm" className="bg-cc-blue hover:bg-blue-600 text-white" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Period Label */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-cc-orange" />
        <span className="text-sm font-medium text-[#e5e2e1]">{data.period}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Opérations',
            value: s.totalOperations,
            sub: `${s.completedOperations} complétées`,
            variation: s.opsVariation,
            icon: BarChart3,
            color: 'text-primary-glow',
          },
          {
            label: 'Chiffre d\'affaires',
            value: formatCurrency(s.totalAmount),
            sub: `${formatCurrency(s.completedAmount)} complété`,
            variation: s.amountVariation,
            icon: TrendingUp,
            color: 'text-green-400',
          },
          {
            label: 'Commissions',
            value: formatCurrency(s.totalCommission),
            sub: `${formatCurrency(s.completedCommission)} complété`,
            variation: 0,
            icon: Wallet,
            color: 'text-secondary-dim',
          },
          {
            label: 'Taux complétion',
            value: s.totalOperations > 0 ? `${Math.round((s.completedOperations / s.totalOperations) * 100)}%` : '0%',
            sub: `${s.completedOperations}/${s.totalOperations}`,
            variation: 0,
            icon: CheckCircle,
            color: 'text-tertiary-dim',
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="bento-cell bg-[#1a1a1a] border border-white/[0.06] p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  <span className="text-[11px] text-[#a89080]">{card.label}</span>
                </div>
                <VariationBadge value={card.variation} />
              </div>
              <p className="text-xl font-bold text-[#e5e2e1]">{card.value}</p>
              <p className="text-[10px] text-[#a89080]">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* By Type Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['RECHARGE', 'SUBSCRIPTION', 'PHYSICAL_CARD'] as const).map(type => {
          const t = data.byType[type]
          const totalForType = data.byType.RECHARGE.count + data.byType.SUBSCRIPTION.count + data.byType.PHYSICAL_CARD.count
          const pct = totalForType > 0 ? Math.round((t.count / totalForType) * 100) : 0
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bento-cell bg-[#1a1a1a] border border-white/[0.06] p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <TypeIcon type={type} />
                  <span className="font-semibold text-sm text-[#e5e2e1]"><TypeLabel type={type} /></span>
                  <Badge className="ml-auto bg-white/[0.04] text-[#a89080] text-[10px]">{pct}%</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-lg font-bold text-[#e5e2e1]">{t.count}</p>
                    <p className="text-[10px] text-[#a89080]">opérations</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold gradient-text">{formatCurrency(t.amount)}</p>
                    <p className="text-[10px] text-[#a89080]">montant</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-[#a89080] mb-1">
                    <span>Complétées: {t.completed}/{t.count}</span>
                    <span>{formatCurrency(t.completedAmount)}</span>
                  </div>
                  <Progress value={t.count > 0 ? (t.completed / t.count) * 100 : 0} className="h-1.5" />
                </div>
                {type !== 'PHYSICAL_CARD' && t.commission > 0 && (
                  <div className="mt-2 flex justify-between text-[10px]">
                    <span className="text-[#a89080]">Commission</span>
                    <span className="text-green-400 font-medium">{formatCurrency(t.commission)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Revenue Chart + By Operator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily breakdown chart */}
        <Card className="lg:col-span-2 bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e5e2e1]">
              <BarChart3 className="w-4 h-4 text-cc-orange" />
              Évolution du chiffre d&apos;affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.dailyBreakdown.length > 0 ? (
              <div>
                <MiniBarChart
                  data={data.dailyBreakdown.map(d => d.amount)}
                  maxValue={maxDailyAmount}
                  colorClass="bg-gradient-to-t from-cc-orange/80 to-cc-orange/40"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-[#a89080]">
                    {new Date(data.dailyBreakdown[0]?.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="text-[10px] text-[#a89080]">
                    {new Date(data.dailyBreakdown[data.dailyBreakdown.length - 1]?.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                {/* Summary below chart */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/[0.04]">
                  <div>
                    <p className="text-[10px] text-[#a89080]">Meilleur jour</p>
                    <p className="text-sm font-bold text-[#e5e2e1]">
                      {formatCurrency(Math.max(...data.dailyBreakdown.map(d => d.amount)))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#a89080]">Moyenne / jour</p>
                    <p className="text-sm font-bold text-[#e5e2e1]">
                      {formatCurrency(Math.round(data.dailyBreakdown.reduce((s, d) => s + d.amount, 0) / Math.max(data.dailyBreakdown.length, 1)))}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center">
                <p className="text-sm text-[#a89080]">Aucune donnée pour cette période</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Operator */}
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e5e2e1]">
              <Phone className="w-4 h-4 text-cc-blue" />
              Par opérateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.byOperator).map(([op, info]) => {
                const opInfo = OPERATOR_INFO[op]
                const pct = s.totalOperations > 0 ? Math.round((info.count / s.totalOperations) * 100) : 0
                return (
                  <div key={op}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {opInfo ? (
                          <Badge className={`${opInfo.bg} ${opInfo.color} text-[10px]`}>{opInfo.name}</Badge>
                        ) : (
                          <Badge className="bg-gray-200 text-gray-600 text-[10px]">{op}</Badge>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[#e5e2e1]">{formatCurrency(info.amount)}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[10px] text-[#a89080]">{info.count} ops ({pct}%)</span>
                      <span className="text-[10px] text-green-400">{info.completed} complétées</span>
                    </div>
                  </div>
                )
              })}
              {Object.keys(data.byOperator).length === 0 && (
                <p className="text-sm text-[#a89080] text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods + Top Cards + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Methods */}
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e5e2e1]">
              <Wallet className="w-4 h-4 text-cc-orange" />
              Méthodes de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.byPaymentMethod).map(([method, info]) => {
                const isWave = method === 'WAVE'
                const isDjamo = method === 'DJAMO'
                return (
                  <div key={method} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isWave ? 'bg-cc-orange/10 text-cc-orange' : isDjamo ? 'bg-green-500/10 text-green-400' : 'bg-white/[0.04] text-[#a89080]'
                      }`}>
                        {isWave ? 'W' : isDjamo ? 'D' : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e5e2e1]">{isWave ? 'Wave' : isDjamo ? 'Djamo' : method}</p>
                        <p className="text-[10px] text-[#a89080]">{info.count} opération{info.count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#e5e2e1]">{formatCurrency(info.amount)}</span>
                  </div>
                )
              })}
              {Object.keys(data.byPaymentMethod).length === 0 && (
                <p className="text-sm text-[#a89080] text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Physical Cards */}
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e5e2e1]">
              <ShoppingCart className="w-4 h-4 text-cc-orange" />
              Top cartes vendues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topSellingCards.length > 0 ? (
                data.topSellingCards.slice(0, 5).map((card, i) => (
                  <div key={card.name} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cc-orange/10 text-cc-orange text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#e5e2e1] truncate max-w-[120px]">{card.name}</p>
                        <p className="text-[10px] text-[#a89080]">{card.count} vente{card.count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold gradient-text">{formatCurrency(card.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#a89080] text-center py-4">Aucune vente de carte</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e5e2e1]">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.byStatus).map(([status, count]) => {
                const pct = s.totalOperations > 0 ? Math.round((count / s.totalOperations) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={status} />
                      <span className="text-xs font-medium text-[#e5e2e1]">{count} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )
              })}
              {Object.keys(data.byStatus).length === 0 && (
                <p className="text-sm text-[#a89080] text-center py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Report */}
      {data.loyalty && (
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e5e2e1]">
              <Trophy className="w-4 h-4 text-orange-400" />
              Rapport Fidélité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                <p className="text-lg font-bold text-white">{data.loyalty.totalClients}</p>
                <p className="text-[10px] text-[#a89080]">Total Clients</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/5 text-center">
                <p className="text-lg font-bold text-orange-400">{data.loyalty.loyalClients}</p>
                <p className="text-[10px] text-[#a89080]">Clients Fidèles</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/5 text-center">
                <p className="text-lg font-bold text-green-400">{data.loyalty.newLoyalClients}</p>
                <p className="text-[10px] text-[#a89080]">Nouveaux Fidèles (période)</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 text-center">
                <p className="text-lg font-bold text-blue-400">{data.loyalty.activePromoCodes}</p>
                <p className="text-[10px] text-[#a89080]">Codes Promo Actifs</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-purple-500/5 text-center">
                <p className="text-lg font-bold text-purple-400">{formatCurrency(data.loyalty.totalPromoValue)}</p>
                <p className="text-[10px] text-[#a89080]">Valeur Promo Active</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/5 text-center">
                <p className="text-lg font-bold text-green-400">{formatCurrency(data.loyalty.usedPromoValue)}</p>
                <p className="text-[10px] text-[#a89080]">Valeur Promo Utilisée ({data.loyalty.promosUsedInPeriod} ce mois)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Table */}
      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-[#e5e2e1]">
              <BarChart3 className="w-4 h-4 text-cc-blue" />
              Détail des opérations ({data.transactions.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            {data.transactions.length > 0 ? (
              <div className="space-y-1.5">
                {data.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 px-3 rounded-xl border border-white/[0.04] bg-[#222222] hover:bg-[#252525] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TypeIcon type={tx.type} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#e5e2e1] truncate">
                            {tx.type === 'PHYSICAL_CARD' ? tx.cardName : tx.phone}
                          </p>
                          <Badge className={`${OPERATOR_INFO[tx.operator]?.bg || 'bg-gray-200'} ${OPERATOR_INFO[tx.operator]?.color || 'text-gray-600'} text-[9px] shrink-0`}>
                            {OPERATOR_INFO[tx.operator]?.name || tx.operator}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#a89080]">{tx.reference}</span>
                          <span className="text-[10px] text-[#a89080]">•</span>
                          <span className="text-[10px] text-[#a89080]">
                            {new Date(tx.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#e5e2e1]">{formatCurrency(tx.amount)}</p>
                        {tx.commission > 0 && (
                          <p className="text-[10px] text-green-400">Comm: {formatCurrency(tx.commission)}</p>
                        )}
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-[#a89080]/20 mx-auto mb-2" />
                <p className="text-sm text-[#a89080]">Aucune opération pour cette période</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
