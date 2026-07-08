'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Phone, Zap, Users, Check, CreditCard,
  BarChart3, TrendingUp, UserPlus, Bell,
  Store, Wallet, RefreshCw, Plus,
  History, CircleDollarSign, Trophy,
  Trash2, Pencil, Calendar, ToggleLeft, ToggleRight, Save,
  Image as ImageIcon, ShoppingCart, Info,
  Loader2, Smartphone, Radio, X, Copy, AlertCircle, Clock, Sparkles, Tag,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency, formatPhoneNumber, formatTransactionCode, stripFormatting } from '@/lib/commissions'
import { OPERATOR_INFO } from '@/lib/constants'
import { AdminReports } from '@/components/admin-reports'
import { AdminFlashProducts } from '@/components/admin-flash-products'
import { AdminLoyalty } from '@/components/admin-loyalty'
import { AdminDocuments } from '@/components/admin-documents'

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recharges, setRecharges] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [publications, setPublications] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [subPlans, setSubPlans] = useState<any[]>([])
  const [physicalCards, setPhysicalCards] = useState<any[]>([])
  const [cardSections, setCardSections] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  const loadStats = useCallback(() => {
    fetch('/api/stats?role=ADMIN')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && !d.error && setStats(d))
      .catch(() => {})
    fetch('/api/recharges?role=ADMIN')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setRecharges(d))
      .catch(() => {})
    fetch('/api/cabine')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setManagers(d))
      .catch(() => {})
    fetch('/api/publications?showAll=true')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setPublications(d))
      .catch(() => {})
    fetch('/api/subscriptions?role=ADMIN')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setSubscriptions(d))
      .catch(() => {})
    fetch('/api/subscription-plans?showAll=true')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setSubPlans(d))
      .catch(() => {})
    fetch('/api/physical-cards?showAll=true')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setPhysicalCards(d))
      .catch(() => {})
    fetch('/api/card-sections?showAll=true&withCards=true')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setCardSections(d))
      .catch(() => {})
    fetch('/api/transactions?role=ADMIN')
      .then(r => r.ok ? r.json() : [])
      .then(d => Array.isArray(d) && setTransactions(d))
      .catch(() => {})
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  return (
    <div className="pt-14 max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-black min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#e5e2e1]">Administration</h1>
            <p className="text-[#a89080] text-sm">Gérez votre activité de recharge</p>
          </div>
          <Button variant="outline" size="sm" className="border-white/[0.06] text-[#a89080] hover:bg-white/5 hover:text-[#e5e2e1]" onClick={loadStats}>
            <RefreshCw className="w-4 h-4 mr-1" /> Actualiser
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap gap-1 mb-6 bg-[#1a1a1a] border border-white/[0.06]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><BarChart3 className="w-4 h-4 mr-1" /> Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="recharges" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Phone className="w-4 h-4 mr-1" /> Recharges</TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><CreditCard className="w-4 h-4 mr-1" /> Souscriptions</TabsTrigger>
            <TabsTrigger value="managers" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Users className="w-4 h-4 mr-1" /> Gérants</TabsTrigger>
            <TabsTrigger value="publications" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Bell className="w-4 h-4 mr-1" /> Publications</TabsTrigger>
            <TabsTrigger value="physical-cards" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><ShoppingCart className="w-4 h-4 mr-1" /> Cartes Physiques</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><BarChart3 className="w-4 h-4 mr-1" /> Rapports</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Zap className="w-4 h-4 mr-1" /> Transactions</TabsTrigger>
            <TabsTrigger value="sims" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Smartphone className="w-4 h-4 mr-1" /> Puces / SIMs</TabsTrigger>
            <TabsTrigger value="flash" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Zap className="w-4 h-4 mr-1" /> Vente Flash</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><FileText className="w-4 h-4 mr-1" /> Documents</TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Trophy className="w-4 h-4 mr-1" /> Fidélité</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview stats={stats} />
          </TabsContent>
          <TabsContent value="recharges">
            <AdminRecharges recharges={recharges} onRefresh={loadStats} />
          </TabsContent>
          <TabsContent value="subscriptions">
            <AdminSubscriptions subscriptions={subscriptions} subPlans={subPlans} onRefresh={loadStats} />
          </TabsContent>
          <TabsContent value="managers">
            <AdminManagers managers={managers} onRefresh={loadStats} />
          </TabsContent>
          <TabsContent value="publications">
            <AdminPublications publications={publications} onRefresh={loadStats} />
          </TabsContent>
          <TabsContent value="physical-cards">
            <AdminPhysicalCards cards={physicalCards} sections={cardSections} onRefresh={loadStats} />
          </TabsContent>
          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
          <TabsContent value="transactions">
            <AdminTransactions transactions={transactions} onRefresh={loadStats} />
          </TabsContent>
          <TabsContent value="sims">
            <AdminSIMs onRefresh={loadStats} />
          </TabsContent>
          <TabsContent value="flash">
            <AdminFlashProducts />
          </TabsContent>
          <TabsContent value="documents">
            <AdminDocuments />
          </TabsContent>
          <TabsContent value="loyalty">
            <AdminLoyalty />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

function AdminOverview({ stats }: { stats: any }) {
  if (!stats) {
    return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-[#1a1a1a] animate-pulse" />)}</div>
  }

  const cards = [
    { label: 'Total Recharges', value: stats.totalRecharges, sub: formatCurrency(stats.totalRechargeAmount), icon: Phone, color: 'text-primary-glow' },
    { label: 'Commissions', value: formatCurrency(stats.totalCommission), sub: 'Revenu total', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Souscriptions', value: stats.totalSubscriptions, sub: formatCurrency(stats.totalSubscriptionAmount), icon: CreditCard, color: 'text-secondary-dim' },
    { label: 'Clients', value: stats.totalClients, sub: `${stats.pendingRecharges || 0} en attente`, icon: Users, color: 'text-tertiary-dim' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="bento-cell bg-[#1a1a1a] border border-white/[0.06] p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`w-5 h-5 ${c.color}`} />
                <span className="text-xs text-[#a89080]">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-[#e5e2e1]">{c.value}</p>
              <p className="text-xs text-[#a89080]">{c.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {stats.rechargesByOperator?.length > 0 && (
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base text-[#e5e2e1]">Recharges par opérateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.rechargesByOperator.map((op: any) => (
                <div key={op.operator} className="flex items-center gap-3">
                  <Badge className={`${OPERATOR_INFO[op.operator]?.bg} ${OPERATOR_INFO[op.operator]?.color}`}>
                    {op.operator}
                  </Badge>
                  <div className="flex-1">
                    <Progress value={(op._count / Math.max(stats.totalRecharges, 1)) * 100} className="h-2" />
                  </div>
                  <span className="text-sm font-medium text-[#e5e2e1]">{op._count} ({formatCurrency(op._sum.amount || 0)})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AdminRecharges({ recharges, onRefresh }: { recharges: any[]; onRefresh?: () => void }) {
  const [validatingId, setValidatingId] = useState<string | null>(null)

  const handleValidate = async (id: string) => {
    setValidatingId(id)
    try {
      const res = await fetch('/api/recharges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'COMPLETED' }),
      })
      if (res.ok) {
        toast.success('Recharge validée ! Solde SIM déduit.')
        onRefresh?.()
      } else {
        toast.error('Erreur lors de la validation')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setValidatingId(null)
    }
  }

  const handleFail = async (id: string) => {
    try {
      const res = await fetch('/api/recharges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'FAILED' }),
      })
      if (res.ok) {
        toast.success('Recharge marquée échouée')
        onRefresh?.()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base text-[#e5e2e1]">Dernières recharges</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {recharges.length === 0 && (
              <p className="text-sm text-[#a89080] text-center py-6">Aucune recharge</p>
            )}
            {recharges.map((r: any) => (
              <div
                key={r.id}
                className={`flex items-center justify-between py-2.5 px-3 rounded-xl border ${
                  r.status === 'COMPLETED'
                    ? 'border-green-500/20 bg-green-500/5'
                    : r.status === 'FAILED'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-orange-500/20 bg-orange-500/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge className={`${OPERATOR_INFO[r.operator]?.bg || 'bg-gray-200'} ${OPERATOR_INFO[r.operator]?.color || 'text-gray-600'}`}>
                    {r.operator}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm text-[#e5e2e1]">{r.clientName}</p>
                    <p className="text-xs text-[#a89080]">{r.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold text-sm text-[#e5e2e1]">{formatCurrency(r.amount)}</p>
                    <p className="text-xs text-green-500">Comm: {formatCurrency(r.commission)}</p>
                  </div>
                  {r.status === 'PENDING' ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-3"
                        onClick={() => handleValidate(r.id)}
                        disabled={validatingId === r.id}
                      >
                        {validatingId === r.id ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 px-2"
                        onClick={() => handleFail(r.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge className={`text-xs ${
                      r.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {r.status === 'COMPLETED' ? 'Complétée' : 'Échouée'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function AdminManagers({ managers, onRefresh }: { managers: any[]; onRefresh: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    setLoading(true)
    try {
      const res = await fetch('/api/cabine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, businessName }),
      })
      if (res.ok) {
        toast.success('Gérant créé avec succès !')
        setName(''); setEmail(''); setBusinessName('')
        onRefresh()
      } else {
        const data = await res.json()
        toast.error(data.error)
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/#cabine=${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    toast.success('Lien copié !')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
            <UserPlus className="w-5 h-5 text-cc-blue" />
            Ajouter un gérant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du gérant" required className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Nom du commerce" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
            <Button type="submit" className="bg-cc-blue hover:bg-blue-600 text-white sm:col-span-3 btn-glow" disabled={loading}>
              {loading ? 'Création...' : <><Plus className="w-4 h-4 mr-1" /> Créer le gérant</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base text-[#e5e2e1]">Gérants existants ({managers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-80">
            <div className="space-y-3">
              {managers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="font-medium text-sm text-[#e5e2e1]">{m.name}</p>
                    <p className="text-xs text-[#a89080]">{m.email} — {m.businessName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-white/[0.06] text-[#a89080]">
                        <Users className="w-3 h-3 mr-1" /> {m._count?.clients || 0} clients
                      </Badge>
                      <Badge variant="outline" className="text-xs border-white/[0.06] text-[#a89080]">
                        <Phone className="w-3 h-3 mr-1" /> {m._count?.recharges || 0} recharges
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={() => copyInviteLink(m.inviteToken)}>
                      {copiedToken === m.inviteToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// ADMIN SUBSCRIPTIONS - Plans & Records Management
// ==========================================
function AdminSubscriptions({ subscriptions, subPlans, onRefresh }: { subscriptions: any[]; subPlans: any[]; onRefresh: () => void }) {
  const [subTab, setSubTab] = useState('plans')
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [planOperator, setPlanOperator] = useState('ORANGE')
  const [planName, setPlanName] = useState('')
  const [planAmount, setPlanAmount] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const resetPlanForm = () => {
    setPlanOperator('ORANGE')
    setPlanName('')
    setPlanAmount('')
    setPlanDescription('')
    setEditingPlan(null)
  }

  const startEditPlan = (plan: any) => {
    setEditingPlan(plan)
    setPlanOperator(plan.operator)
    setPlanName(plan.name)
    setPlanAmount(String(plan.amount))
    setPlanDescription(plan.description || '')
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planName || !planAmount) {
      toast.error('Nom et montant requis')
      return
    }
    setLoading(true)
    try {
      if (editingPlan) {
        // Update existing plan
        const res = await fetch('/api/subscription-plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPlan.id,
            operator: planOperator,
            name: planName,
            amount: parseInt(planAmount),
            description: planDescription,
          }),
        })
        if (res.ok) {
          toast.success('Forfait modifié !')
          resetPlanForm()
          onRefresh()
        } else {
          const data = await res.json()
          toast.error(data.error)
        }
      } else {
        // Create new plan
        const res = await fetch('/api/subscription-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operator: planOperator,
            name: planName,
            amount: parseInt(planAmount),
            description: planDescription,
          }),
        })
        if (res.ok) {
          toast.success('Forfait ajouté !')
          resetPlanForm()
          onRefresh()
        } else {
          const data = await res.json()
          toast.error(data.error)
        }
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePlan = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/subscription-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      if (res.ok) {
        toast.success(active ? 'Forfait désactivé' : 'Forfait activé')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDeletePlan = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/subscription-plans?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Forfait supprimé')
        onRefresh()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubscriptionStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Souscription marquée comme ${status === 'COMPLETED' ? 'complétée' : status === 'FAILED' ? 'échouée' : 'en attente'}`)
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const safeSubPlans = Array.isArray(subPlans) ? subPlans : []
  const plansByOperator = safeSubPlans.reduce((acc: any, plan: any) => {
    if (!acc[plan.operator]) acc[plan.operator] = []
    acc[plan.operator].push(plan)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="mb-4 bg-[#1a1a1a] border border-white/[0.06]">
          <TabsTrigger value="plans" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-1" /> Forfaits
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white">
            <History className="w-4 h-4 mr-1" /> Souscriptions ({subscriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          {/* Add/Edit Plan Form */}
          <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
                {editingPlan ? <Pencil className="w-5 h-5 text-cc-yellow" /> : <Plus className="w-5 h-5 text-cc-blue" />}
                {editingPlan ? 'Modifier le forfait' : 'Ajouter un forfait'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Opérateur</Label>
                    <Select value={planOperator} onValueChange={setPlanOperator}>
                      <SelectTrigger className="bg-[#222222] border-white/[0.06] text-[#e5e2e1]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                        <SelectItem value="ORANGE">Orange</SelectItem>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="MOOV">Moov</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Nom du forfait</Label>
                    <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Ex: Bon Plan 500" required className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Montant (FCFA)</Label>
                    <Input type="number" value={planAmount} onChange={e => setPlanAmount(e.target.value)} placeholder="500" required min={100} max={100000} className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Description</Label>
                    <Input value={planDescription} onChange={e => setPlanDescription(e.target.value)} placeholder="Appels + SMS + Data" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-cc-blue hover:bg-blue-600 text-white btn-glow" disabled={loading}>
                    {loading ? 'Enregistrement...' : editingPlan ? <><Save className="w-4 h-4 mr-1" /> Enregistrer</> : <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                  </Button>
                  {editingPlan && (
                    <Button type="button" variant="outline" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={resetPlanForm}>
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Plans by operator */}
          {Object.entries(plansByOperator).map(([op, plans]: [string, any]) => (
            <Card key={op} className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
                  <Badge className={`${OPERATOR_INFO[op]?.bg} ${OPERATOR_INFO[op]?.color}`}>
                    {OPERATOR_INFO[op]?.name || op}
                  </Badge>
                  <span>{plans.length} forfait{plans.length > 1 ? 's' : ''}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plans.map((plan: any) => (
                    <div
                      key={plan.id}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-smooth ${
                        !plan.active ? 'border-white/[0.03] bg-white/[0.01] opacity-50' : 'border-white/[0.06] bg-[#222222]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-right min-w-[80px]">
                          <p className="font-bold text-sm text-[#e5e2e1]">{formatCurrency(plan.amount)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#e5e2e1]">{plan.name}</p>
                          {plan.description && <p className="text-xs text-[#a89080]">{plan.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${plan.active ? 'text-green-400 hover:bg-green-500/10' : 'text-[#a89080] hover:bg-white/5'}`}
                          onClick={() => handleTogglePlan(plan.id, plan.active)}
                          title={plan.active ? 'Désactiver' : 'Activer'}
                        >
                          {plan.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-cc-yellow hover:bg-yellow-500/10"
                          onClick={() => startEditPlan(plan)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={deletingId === plan.id}
                          title="Supprimer"
                        >
                          {deletingId === plan.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {safeSubPlans.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-[#a89080]/30 mx-auto mb-3" />
              <p className="text-[#a89080]">Aucun forfait. Ajoutez-en un ci-dessus.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="records">
          <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#e5e2e1]">Dernières souscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {subscriptions.length === 0 && (
                    <p className="text-sm text-[#a89080] text-center py-6">Aucune souscription</p>
                  )}
                  {subscriptions.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-white/[0.04] bg-[#222222]">
                      <div className="flex items-center gap-3">
                        <Badge className={`${OPERATOR_INFO[s.operator]?.bg || 'bg-gray-200'} ${OPERATOR_INFO[s.operator]?.color || 'text-gray-600'} text-xs`}>
                          {s.operator}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm text-[#e5e2e1]">{s.clientName} — {s.planName}</p>
                          <p className="text-xs text-[#a89080]">{s.phone} • {new Date(s.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-sm text-[#e5e2e1]">{formatCurrency(s.amount)}</p>
                          <p className="text-xs text-green-500">Comm: {formatCurrency(s.commission)}</p>
                        </div>
                        <Select
                          value={s.status}
                          onValueChange={(val) => handleSubscriptionStatus(s.id, val)}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs bg-[#1a1a1a] border-white/[0.06]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                            <SelectItem value="PENDING">En attente</SelectItem>
                            <SelectItem value="COMPLETED">Complétée</SelectItem>
                            <SelectItem value="FAILED">Échouée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Service categories for publications
const SERVICE_CATEGORIES = [
  { value: 'FLYERS', label: 'Flyers', icon: '📄' },
  { value: 'CARTES_INVITATION', label: 'Cartes d\'invitation', icon: '💌' },
  { value: 'IMPRESSION', label: 'Impression', icon: '🖨️' },
  { value: 'PHOTO', label: 'Photo minute', icon: '📸' },
  { value: 'PLASTIFICATION', label: 'Plastification', icon: '📋' },
  { value: 'SCAN', label: 'Scan & Numérisation', icon: '📠' },
  { value: 'RELIURE', label: 'Reliure', icon: '📕' },
  { value: 'AUTRE', label: 'Autre service', icon: '✨' },
]

function AdminPublications({ publications, onRefresh }: { publications: any[]; onRefresh: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [operator, setOperator] = useState('')
  const [type, setType] = useState('PROMO')
  const [serviceCategory, setServiceCategory] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingPublication, setEditingPublication] = useState<any>(null)

  const isExpired = (p: any) => p.expiresAt && new Date(p.expiresAt) < new Date()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return
    setLoading(true)
    try {
      const body: any = {
        title,
        content,
        operator: type === 'SERVICE' ? null : (operator && operator !== 'ALL' ? operator : null),
        type,
        serviceCategory: type === 'SERVICE' ? (serviceCategory || null) : null,
        isNew: type === 'SERVICE' ? isNew : false,
        expiresAt: expiresAt || null,
        imageUrl: imageUrl || '',
      }
      let res: Response
      if (editingPublication) {
        body.id = editingPublication.id
        res = await fetch('/api/publications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/publications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      if (res.ok) {
        toast.success(editingPublication ? 'Publication mise à jour !' : 'Publication créée !')
        resetPublicationForm()
        onRefresh()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'services')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setImageUrl(data.url)
        toast.success('Image ajoutée !')
      } else {
        toast.error(data.error || 'Erreur lors de l\'upload')
      }
    } catch {
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const startEditPublication = (p: any) => {
    setEditingPublication(p)
    setTitle(p.title)
    setContent(p.content)
    setType(p.type)
    setOperator(p.operator || '')
    setServiceCategory(p.serviceCategory || '')
    setImageUrl(p.imageUrl || '')
    setIsNew(p.isNew || false)
    setExpiresAt(p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 10) : '')
  }

  const resetPublicationForm = () => {
    setTitle(''); setContent(''); setOperator(''); setType('PROMO'); setServiceCategory(''); setIsNew(false); setExpiresAt(''); setImageUrl('')
    setEditingPublication(null)
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/publications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      if (res.ok) {
        toast.success(active ? 'Publication désactivée' : 'Publication activée')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/publications?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Publication supprimée')
        onRefresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setDeletingId(null)
    }
  }

  const expiredCount = publications.filter(isExpired).length
  const activePubs = publications.filter(p => p.active && !isExpired(p))
  const inactivePubs = publications.filter(p => !p.active || isExpired(p))

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
            <Bell className="w-5 h-5 text-cc-blue" />
            Nouvelle publication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" required className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
              <Select value={type} onValueChange={(v) => { setType(v); if (v !== 'SERVICE') { setServiceCategory(''); setIsNew(false); } }}>
                <SelectTrigger className="bg-[#222222] border-white/[0.06] text-[#e5e2e1]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                  <SelectItem value="PROMO">🎁 Promotion</SelectItem>
                  <SelectItem value="BONUS">⚡ Bonus</SelectItem>
                  <SelectItem value="INFO">ℹ️ Information</SelectItem>
                  <SelectItem value="SERVICE">🛎️ Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Operator selector — only for non-SERVICE types */}
            {type !== 'SERVICE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger className="bg-[#222222] border-white/[0.06] text-[#e5e2e1]"><SelectValue placeholder="Opérateur (tous par défaut)" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                    <SelectItem value="ALL">Tous les opérateurs</SelectItem>
                    <SelectItem value="ORANGE">Orange</SelectItem>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="MOOV">Moov</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Label className="text-[#a89080] text-xs">Date d&apos;échéance (optionnel)</Label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50"
                  />
                </div>
              </div>
            )}

            {/* Service fields — only for SERVICE type */}
            {type === 'SERVICE' && (
              <div className="space-y-4 p-4 rounded-xl bg-gradient-to-r from-red-500/5 to-orange-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-[#e5e2e1]">Catégorie de service</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SERVICE_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setServiceCategory(cat.value === serviceCategory ? '' : cat.value)}
                      className={`p-2.5 rounded-lg border-2 text-center transition-smooth text-sm ${
                        serviceCategory === cat.value
                          ? 'border-red-500 bg-red-500/10 text-[#e5e2e1]'
                          : 'border-white/[0.06] bg-[#222222] text-[#a89080] hover:border-red-500/30'
                      }`}
                    >
                      <span className="block text-lg mb-0.5">{cat.icon}</span>
                      <span className="block text-[10px] leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {/* isNew toggle */}
                  <button
                    type="button"
                    onClick={() => setIsNew(!isNew)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-smooth ${
                      isNew
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : 'border-white/[0.06] bg-[#222222] text-[#a89080] hover:border-red-500/30'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${isNew ? 'animate-pulse' : ''}`} />
                    <span className="text-sm font-medium">Badge NEW</span>
                  </button>

                  <div className="flex-1 space-y-1">
                    <Label className="text-[#a89080] text-xs">Date d&apos;échéance (optionnel)</Label>
                    <Input
                      type="date"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image upload — available for all publication types */}
            <div className="space-y-3">
              <Label className="text-[#a89080] text-xs flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Image {type === 'SERVICE' ? 'du service' : 'de la publication'} (optionnel)
              </Label>
              <div className="flex items-center gap-3">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-smooth ${
                  uploading
                    ? 'border-cc-blue/50 bg-cc-blue/5 text-cc-blue opacity-50'
                    : 'border-white/[0.1] bg-[#222222] text-[#a89080] hover:border-cc-blue/30 hover:text-[#e5e2e1]'
                }`}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  <span className="text-sm">{uploading ? 'Upload...' : 'Choisir une image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {imageUrl && (
                  <div className="relative group">
                    <img src={imageUrl} alt="Aperçu" className="w-16 h-16 rounded-lg object-cover border border-white/[0.06]" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              {imageUrl && !imageUrl.startsWith('/uploads/') && (
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Ou entrez une URL d'image" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 text-xs h-8" />
              )}
            </div>

            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenu de la publication" required className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
            <div className="flex gap-3">
              <Button type="submit" className="bg-cc-blue hover:bg-blue-600 text-white btn-glow" disabled={loading}>
                {loading ? 'Enregistrement...' : editingPublication ? <><Save className="w-4 h-4 mr-1" /> Mettre à jour</> : <><Bell className="w-4 h-4 mr-1" /> Publier</>}
              </Button>
              {editingPublication && (
                <Button type="button" variant="outline" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={resetPublicationForm}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{activePubs.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#a89080]">Actives</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{expiredCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#a89080]">Expirées</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-[#a89080]">{inactivePubs.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#a89080]">Inactives</p>
        </div>
      </div>

      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base text-[#e5e2e1]">Toutes les publications ({publications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {publications.length === 0 && (
                <p className="text-sm text-[#a89080] text-center py-6">Aucune publication</p>
              )}
              {publications.map((p: any) => {
                const expired = isExpired(p)
                const serviceCat = SERVICE_CATEGORIES.find(c => c.value === p.serviceCategory)
                return (
                  <div
                    key={p.id}
                    className={`py-3 px-3 rounded-xl border transition-smooth ${
                      p.isNew && p.active && !expired
                        ? 'border-red-500/40 bg-red-500/5'
                        : expired
                        ? 'border-red-500/20 bg-red-500/5'
                        : !p.active
                        ? 'border-white/[0.03] bg-white/[0.01] opacity-60'
                        : 'border-white/[0.06] bg-[#222222]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {p.type === 'SERVICE' ? (
                            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs gap-1">
                              <Tag className="w-3 h-3" /> SERVICE
                            </Badge>
                          ) : (
                            <Badge variant={p.type === 'PROMO' ? 'default' : p.type === 'BONUS' ? 'secondary' : 'outline'} className="text-xs">
                              {p.type}
                            </Badge>
                          )}
                          {p.isNew && (
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs animate-pulse">
                              <Sparkles className="w-3 h-3 mr-1" /> NEW
                            </Badge>
                          )}
                          {p.operator && (
                            <Badge className={`${OPERATOR_INFO[p.operator]?.bg} ${OPERATOR_INFO[p.operator]?.color} text-xs`}>
                              {p.operator}
                            </Badge>
                          )}
                          {serviceCat && (
                            <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs">
                              {serviceCat.icon} {serviceCat.label}
                            </Badge>
                          )}
                          {expired && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" /> Expirée
                            </Badge>
                          )}
                          {!p.active && !expired && (
                            <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-500">
                              Désactivée
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-[#e5e2e1] truncate">{p.title}</span>
                        </div>
                        {p.type === 'SERVICE' && p.imageUrl && (
                          <img src={p.imageUrl} alt={p.title} className="w-full h-32 object-cover rounded-lg mt-2 mb-1" />
                        )}
                        <p className="text-xs text-[#a89080] mb-1 line-clamp-2">{p.content}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[#a89080]/70">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                          {p.expiresAt && (
                            <span className={`flex items-center gap-1 ${expired ? 'text-red-400' : 'text-yellow-400'}`}>
                              <Calendar className="w-3 h-3" />
                              Échéance: {new Date(p.expiresAt).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${p.active ? 'text-green-400 hover:bg-green-500/10' : 'text-[#a89080] hover:bg-white/5'}`}
                          onClick={() => handleToggle(p.id, p.active)}
                          title={p.active ? 'Désactiver' : 'Activer'}
                        >
                          {p.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-cc-yellow hover:bg-yellow-500/10"
                          onClick={() => startEditPublication(p)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          title="Supprimer"
                        >
                          {deletingId === p.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// ADMIN TRANSACTIONS - Manage Transactions
// ==========================================
function AdminTransactions({ transactions, onRefresh }: { transactions: any[]; onRefresh: () => void }) {
  const [validatingId, setValidatingId] = useState<string | null>(null)

  const handleValidate = async (id: string) => {
    setValidatingId(id)
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'COMPLETED' }),
      })
      if (res.ok) {
        toast.success('Transaction validée !')
        onRefresh()
      } else {
        toast.error('Erreur lors de la validation')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setValidatingId(null)
    }
  }

  const handleFail = async (id: string) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'FAILED' }),
      })
      if (res.ok) {
        toast.success('Transaction marquée échouée')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  // Stats summary
  const pendingCount = transactions.filter(t => t.status === 'PAYMENT_PENDING' || t.status === 'PAYMENT_CONFIRMED').length
  const processingCount = transactions.filter(t => t.status === 'PROCESSING').length
  const completedCount = transactions.filter(t => t.status === 'COMPLETED').length

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1a1a] border border-white/[0.06] p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#a89080]">En attente</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/[0.06] p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-blue-400">{processingCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#a89080]">En cours</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/[0.06] p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-green-400">{completedCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#a89080]">Complétées</p>
        </div>
      </div>

      {/* Transactions list */}
      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base text-[#e5e2e1]">Toutes les transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {transactions.length === 0 && (
                <p className="text-sm text-[#a89080] text-center py-6">Aucune transaction</p>
              )}
              {transactions.map((t: any) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl border ${
                    t.status === 'COMPLETED'
                      ? 'border-green-500/20 bg-green-500/5'
                      : t.status === 'FAILED'
                      ? 'border-red-500/20 bg-red-500/5'
                      : t.status === 'PROCESSING'
                      ? 'border-blue-500/20 bg-blue-500/5'
                      : 'border-orange-500/20 bg-orange-500/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`${OPERATOR_INFO[t.operator]?.bg || 'bg-gray-200'} ${OPERATOR_INFO[t.operator]?.color || 'text-gray-600'}`}>
                      {t.operator}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-cc-blue">{t.reference}</span>
                        <Badge variant="outline" className="text-[10px] border-white/[0.06] text-[#a89080]">
                          {t.type === 'RECHARGE' ? 'Recharge' : 'Forfait'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-white/[0.06] text-[#a89080]">
                          {t.paymentMethod}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#a89080]">{t.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-bold text-sm text-[#e5e2e1]">{formatCurrency(t.amount)}</p>
                      <p className="text-[10px] text-[#a89080]">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    {t.status === 'PROCESSING' ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-3"
                          onClick={() => handleValidate(t.id)}
                          disabled={validatingId === t.id}
                        >
                          {validatingId === t.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 px-2"
                          onClick={() => handleFail(t.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge className={`text-xs ${
                        t.status === 'COMPLETED' ? 'bg-green-600 text-white' :
                        t.status === 'FAILED' ? 'bg-red-600 text-white' :
                        t.status === 'PAYMENT_PENDING' ? 'bg-yellow-500 text-black' :
                        t.status === 'PAYMENT_CONFIRMED' ? 'bg-orange-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {t.status === 'COMPLETED' ? 'Complétée' :
                         t.status === 'FAILED' ? 'Échouée' :
                         t.status === 'PAYMENT_PENDING' ? 'Paiement en attente' :
                         t.status === 'PAYMENT_CONFIRMED' ? 'Paiement confirmé' :
                         'En cours'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// ADMIN SIMs - Manage SIM Card Balances
// ==========================================
function AdminSIMs({ onRefresh }: { onRefresh: () => void }) {
  const [sims, setSims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSim, setEditSim] = useState<any>(null)
  const [operator, setOperator] = useState('ORANGE')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [balance, setBalance] = useState('')
  const [transactionNumbers, setTransactionNumbers] = useState('')
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [rechargingId, setRechargingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showTxDialog, setShowTxDialog] = useState<string | null>(null) // sim ID for which to show dialog
  const [newTxNumber, setNewTxNumber] = useState('')
  const [copiedTx, setCopiedTx] = useState<string | null>(null)

  const loadSims = useCallback(() => {
    setLoading(true)
    fetch('/api/sim-balances?adminOnly=true')
      .then(r => r.json())
      .then(data => { setSims(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadSims() }, [loadSims])

  const resetForm = () => {
    setOperator('ORANGE'); setPhoneNumber(''); setBalance(''); setTransactionNumbers(''); setEditSim(null); setShowForm(false)
  }

  const openAddForm = () => {
    setOperator('ORANGE'); setPhoneNumber(''); setBalance(''); setTransactionNumbers(''); setEditSim(null); setShowForm(true)
  }

  // Handle phone number input with auto-formatting
  const handlePhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 10) {
      setPhoneNumber(formatPhoneNumber(digits))
    }
  }

  // Handle transaction number input with auto-formatting
  const handleTxNumberInput = (value: string) => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '')
    if (clean.length <= 20) {
      setNewTxNumber(formatTransactionCode(clean))
    }
  }

  // Handle multiple transaction numbers in the form (comma separated)
  const handleFormTxInput = (value: string) => {
    // Format each code separately
    const codes = value.split(',')
    const formatted = codes.map(code => {
      const clean = code.trim().replace(/[^a-zA-Z0-9]/g, '')
      return clean ? formatTransactionCode(clean) : ''
    }).join(', ')
    setTransactionNumbers(formatted)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const rawPhone = stripFormatting(phoneNumber)
    if (!rawPhone) { toast.error('Numéro de téléphone requis'); return }
    setSaving(true)
    try {
      // Strip formatting from transaction numbers before sending
      const rawTxNumbers = transactionNumbers
        .split(',')
        .map(t => stripFormatting(t.trim()))
        .filter(Boolean)
        .join(',')

      const body: any = { operator, phoneNumber: rawPhone, balance: parseInt(balance) || 0, transactionNumbers: rawTxNumbers }
      if (editSim) body.id = editSim.id

      const res = await fetch('/api/sim-balances', {
        method: editSim ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editSim ? 'SIM modifiée !' : 'SIM ajoutée !')
        resetForm()
        loadSims()
      } else {
        const data = await res.json()
        toast.error(data.error)
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleRecharge = async (simId: string) => {
    if (!rechargeAmount || parseInt(rechargeAmount) <= 0) {
      toast.error('Montant invalide')
      return
    }
    setRechargingId(simId)
    try {
      const res = await fetch('/api/sim-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: simId, amount: parseInt(rechargeAmount) }),
      })
      if (res.ok) {
        toast.success(`Puce approvisionnée de ${formatCurrency(parseInt(rechargeAmount))} !`)
        setRechargeAmount('')
        setRechargingId(null)
        loadSims()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setRechargingId(null)
    }
  }

  // Add a transaction number to an existing SIM
  const handleAddTxNumber = async () => {
    if (!showTxDialog || !newTxNumber.trim()) return
    const rawCode = stripFormatting(newTxNumber.trim())
    if (!rawCode) { toast.error('Numéro de transaction requis'); return }
    try {
      const res = await fetch('/api/sim-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showTxDialog, transactionNumbers: `+${rawCode}` }),
      })
      if (res.ok) {
        toast.success('Numéro de transaction ajouté !')
        setNewTxNumber('')
        setShowTxDialog(null)
        loadSims()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur')
    }
  }

  // Copy a transaction number to clipboard
  const handleCopyTx = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedTx(code)
    setTimeout(() => setCopiedTx(null), 2000)
    toast.success('Numéro copié !')
  }

  // Delete a specific transaction number from a SIM
  const handleDeleteTxNumber = async (simId: string, codeToDelete: string) => {
    const sim = sims.find((s: any) => s.id === simId)
    if (!sim) return
    const existing = (sim.transactionNumbers || '').split(',').filter(Boolean)
    const updated = existing.filter((c: string) => c !== codeToDelete).join(',')
    try {
      const res = await fetch('/api/sim-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: simId, transactionNumbers: updated }),
      })
      if (res.ok) {
        toast.success('Numéro supprimé')
        loadSims()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleSetBalance = async (simId: string, newBalance: string) => {
    const val = parseInt(newBalance)
    if (isNaN(val) || val < 0) {
      toast.error('Montant invalide')
      return
    }
    try {
      const res = await fetch('/api/sim-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: simId, setBalance: val }),
      })
      if (res.ok) {
        toast.success(`Solde mis à jour !`)
        loadSims()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sim-balances?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('SIM supprimée')
        loadSims()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const totalBalance = sims.reduce((sum: number, s: any) => sum + (s.balance || 0), 0)

  return (
    <div className="space-y-6">
      {/* Guide message */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-cc-blue/5 border border-cc-blue/10">
        <Info className="w-4 h-4 text-cc-blue mt-0.5 shrink-0" />
        <div className="text-xs text-[#a89080]">
          <strong className="text-cc-blue">Approvisionnement des puces</strong> — Gérez les soldes de vos puces (SIMs) par opérateur. Ajoutez les numéros de transaction pour les retrouver facilement. Les séparateurs vous aident à saisir les numéros sans erreur sur votre téléphone.
        </div>
      </div>

      {/* Total balance card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-cell bg-[#1a1a1a] border border-white/[0.06] p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <CircleDollarSign className="w-5 h-5 text-primary-glow" />
            <span className="text-xs text-[#a89080]">Solde total puces</span>
          </div>
          <p className="text-2xl font-bold text-[#e5e2e1]">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="bento-cell bg-[#1a1a1a] border border-white/[0.06] p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-tertiary-dim" />
            <span className="text-xs text-[#a89080]">Nombre de puces</span>
          </div>
          <p className="text-2xl font-bold text-[#e5e2e1]">{sims.length}</p>
        </div>
        <div className="bento-cell bg-[#1a1a1a] border border-white/[0.06] p-5 rounded-2xl flex items-center justify-center">
          {!showForm && (
            <Button className="bg-gradient-to-r from-cc-orange to-orange-600 text-white btn-glow-orange" onClick={openAddForm}>
              <Plus className="w-4 h-4 mr-1" /> Ajouter une puce
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit SIM form */}
      {showForm && (
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
              {editSim ? <Pencil className="w-5 h-5 text-cc-yellow" /> : <Plus className="w-5 h-5 text-cc-orange" />}
              {editSim ? 'Modifier la puce' : 'Ajouter une puce'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#a89080]">Opérateur *</Label>
                  <Select value={operator} onValueChange={setOperator}>
                    <SelectTrigger className="bg-[#222222] border-white/[0.06] text-[#e5e2e1]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                      <SelectItem value="ORANGE">Orange</SelectItem>
                      <SelectItem value="MTN">MTN</SelectItem>
                      <SelectItem value="MOOV">Moov</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a89080]">Numéro de téléphone *</Label>
                  <Input
                    value={phoneNumber}
                    onChange={e => handlePhoneInput(e.target.value)}
                    placeholder="07 XX XX XX XX"
                    required
                    className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 font-mono tracking-wider"
                  />
                  <p className="text-[10px] text-[#a89080]/60">Format automatique: 07 XX XX XX XX</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a89080]">Solde initial (FCFA)</Label>
                  <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                </div>
              </div>
              {/* Transaction numbers input */}
              <div className="space-y-2">
                <Label className="text-[#a89080]">Numéros de transaction / codes de recharge</Label>
                <Input
                  value={transactionNumbers}
                  onChange={e => handleFormTxInput(e.target.value)}
                  placeholder="Ex: 1234-5678-9012, 9876-5432-1098"
                  className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 font-mono tracking-wider"
                />
                <p className="text-[10px] text-[#a89080]/60">
                  Séparez les codes par des virgules. Les séparateurs (-) sont ajoutés automatiquement pour faciliter la saisie sur téléphone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-cc-orange hover:bg-orange-600 text-white btn-glow-orange" disabled={saving}>
                  {saving ? 'Enregistrement...' : editSim ? <><Save className="w-4 h-4 mr-1" /> Enregistrer</> : <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                </Button>
                <Button type="button" variant="outline" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SIM cards list */}
      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base text-[#e5e2e1]">Puces / SIMs ({sims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4">
              {loading && sims.length === 0 && (
                <div className="text-center py-8">
                  <Smartphone className="w-10 h-10 text-[#a89080]/30 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm text-[#a89080]">Chargement...</p>
                </div>
              )}
              {!loading && sims.length === 0 && (
                <div className="text-center py-8">
                  <Smartphone className="w-10 h-10 text-[#a89080]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#a89080]">Aucune puce enregistrée. Ajoutez vos puces pour suivre vos soldes.</p>
                </div>
              )}
              {sims.map((sim: any) => {
                const opInfo = OPERATOR_INFO[sim.operator] || OPERATOR_INFO.ORANGE
                const txNumbers = (sim.transactionNumbers || '').split(',').filter(Boolean)
                const formattedPhone = formatPhoneNumber(sim.phoneNumber)
                return (
                  <div key={sim.id} className="py-4 px-4 rounded-xl border border-white/[0.06] bg-[#222222]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${opInfo.bg} ${opInfo.color} flex items-center justify-center`}>
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${opInfo.bg} ${opInfo.color} text-xs`}>{opInfo.name}</Badge>
                            <span className="text-sm text-[#e5e2e1] font-mono font-medium tracking-wide">{formattedPhone}</span>
                            <button
                              onClick={() => handleCopyTx(sim.phoneNumber)}
                              className="p-0.5 hover:bg-white/5 rounded transition-smooth"
                              title="Copier le numéro"
                            >
                              {copiedTx === sim.phoneNumber ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-[#a89080]" />}
                            </button>
                          </div>
                          <p className="text-xs text-[#a89080] mt-0.5">
                            Solde: <strong className="text-[#e5e2e1]">{formatCurrency(sim.balance)}</strong>
                            {sim.lastRecharge && <span> • Dernier approvisionnement: {new Date(sim.lastRecharge).toLocaleDateString('fr-FR')}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(sim.id)} title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Transaction numbers section */}
                    {txNumbers.length > 0 && (
                      <div className="mb-3 p-3 rounded-lg bg-[#1a1a1a] border border-white/[0.04]">
                        <p className="text-[10px] uppercase tracking-widest text-[#a89080] mb-2">Numéros de transaction</p>
                        <div className="flex flex-wrap gap-2">
                          {txNumbers.map((code: string, idx: number) => {
                            const formattedCode = formatTransactionCode(code)
                            return (
                              <div
                                key={idx}
                                className="group flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2a2a2a] border border-white/[0.06] hover:border-cc-blue/30 transition-smooth"
                              >
                                <span className="text-sm font-mono font-bold text-cc-blue tracking-wider">{formattedCode}</span>
                                <button
                                  onClick={() => handleCopyTx(code)}
                                  className="opacity-60 group-hover:opacity-100 p-0.5 hover:bg-white/5 rounded transition-smooth"
                                  title="Copier"
                                >
                                  {copiedTx === code ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-[#a89080]" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteTxNumber(sim.id, code)}
                                  className="opacity-60 group-hover:opacity-100 p-0.5 hover:bg-red-500/10 rounded transition-smooth"
                                  title="Supprimer"
                                >
                                  <X className="w-3 h-3 text-red-400" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add transaction number button */}
                    {showTxDialog === sim.id ? (
                      <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-cc-blue/5 border border-cc-blue/10">
                        <Input
                          value={newTxNumber}
                          onChange={e => handleTxNumberInput(e.target.value)}
                          placeholder="Entrez le numéro (ex: 1234-5678-9012)"
                          className="flex-1 h-9 bg-[#1a1a1a] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 text-sm font-mono tracking-wider"
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddTxNumber() }
                          }}
                        />
                        <Button size="sm" className="bg-cc-blue hover:bg-blue-600 text-white h-9" onClick={handleAddTxNumber}>
                          <Plus className="w-3 h-3 mr-1" /> Ajouter
                        </Button>
                        <Button size="sm" variant="ghost" className="text-[#a89080] h-9" onClick={() => { setShowTxDialog(null); setNewTxNumber('') }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-cc-blue/20 text-cc-blue hover:bg-cc-blue/10 h-9"
                          onClick={() => setShowTxDialog(sim.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Ajouter numéro
                        </Button>
                      </div>
                    )}

                    {/* Recharge / Set balance */}
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={rechargeAmount}
                        onChange={e => setRechargeAmount(e.target.value)}
                        placeholder="Montant à ajouter"
                        className="flex-1 h-9 bg-[#1a1a1a] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 text-sm"
                      />
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white h-9"
                        disabled={rechargingId === sim.id}
                        onClick={() => handleRecharge(sim.id)}
                      >
                        {rechargingId === sim.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-1" /> Approvisionner</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/[0.06] text-[#a89080] hover:bg-white/5 h-9"
                        onClick={() => handleSetBalance(sim.id, prompt('Nouveau solde (FCFA):', String(sim.balance)) || String(sim.balance))}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Définir solde
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// ADMIN PHYSICAL CARDS - Manage Physical Cards
// ==========================================
function AdminPhysicalCards({ cards, sections, onRefresh }: { cards: any[]; sections: any[]; onRefresh: () => void }) {
  // Card form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [operator, setOperator] = useState('ALL')
  const [stock, setStock] = useState('-1')
  const [cardSectionId, setCardSectionId] = useState<string>('none')
  const [loading, setLoading] = useState(false)
  const [editingCard, setEditingCard] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Section form state
  const [sectionTitle, setSectionTitle] = useState('')
  const [sectionGuideMessage, setSectionGuideMessage] = useState('')
  const [sectionPosition, setSectionPosition] = useState('')
  const [sectionLoading, setSectionLoading] = useState(false)
  const [editingSection, setEditingSection] = useState<any>(null)
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)
  const [showSectionForm, setShowSectionForm] = useState(false)

  // Sub-tab for sections vs cards
  const [subTab, setSubTab] = useState<'sections' | 'cards'>('sections')

  const resetCardForm = () => {
    setName(''); setDescription(''); setPrice(''); setImageUrl(''); setOperator('ALL'); setStock('-1'); setCardSectionId('none')
    setEditingCard(null)
  }

  const resetSectionForm = () => {
    setSectionTitle(''); setSectionGuideMessage(''); setSectionPosition('')
    setEditingSection(null)
    setShowSectionForm(false)
  }

  const startEditCard = (card: any) => {
    setEditingCard(card)
    setName(card.name)
    setDescription(card.description || '')
    setPrice(String(card.price))
    setImageUrl(card.imageUrl || '')
    setOperator(card.operator || 'ALL')
    setStock(String(card.stock))
    setCardSectionId(card.sectionId || 'none')
    setSubTab('cards')
  }

  const startEditSection = (section: any) => {
    setEditingSection(section)
    setSectionTitle(section.title)
    setSectionGuideMessage(section.guideMessage || '')
    setSectionPosition(String(section.position))
    setShowSectionForm(true)
  }

  // ==========================================
  // CARD CRUD
  // ==========================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'cards')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setImageUrl(data.url)
        toast.success('Image téléchargée !')
      } else {
        toast.error(data.error || 'Erreur lors du téléchargement')
      }
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) {
      toast.error('Nom et prix requis')
      return
    }
    setLoading(true)
    try {
      const body = {
        name,
        description,
        price: parseInt(price),
        imageUrl,
        operator,
        stock: parseInt(stock),
        sectionId: cardSectionId === 'none' ? null : cardSectionId,
        ...(editingCard ? { id: editingCard.id } : {}),
      }

      const res = await fetch('/api/physical-cards', {
        method: editingCard ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editingCard ? 'Carte modifiée !' : 'Carte ajoutée !')
        resetCardForm()
        onRefresh()
      } else {
        const data = await res.json()
        toast.error(data.error)
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCard = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/physical-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      if (res.ok) {
        toast.success(active ? 'Carte désactivée' : 'Carte activée')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDeleteCard = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/physical-cards?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Carte supprimée')
        onRefresh()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setDeletingId(null)
    }
  }

  const handleMoveCardToSection = async (cardId: string, newSectionId: string) => {
    try {
      const res = await fetch('/api/physical-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cardId, sectionId: newSectionId === 'none' ? null : newSectionId }),
      })
      if (res.ok) {
        toast.success('Carte déplacée !')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  // ==========================================
  // SECTION CRUD
  // ==========================================
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectionTitle) {
      toast.error('Titre de section requis')
      return
    }
    setSectionLoading(true)
    try {
      const body = {
        title: sectionTitle,
        guideMessage: sectionGuideMessage,
        position: sectionPosition ? parseInt(sectionPosition) : undefined,
        ...(editingSection ? { id: editingSection.id } : {}),
      }

      const res = await fetch('/api/card-sections', {
        method: editingSection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editingSection ? 'Section modifiée !' : 'Section ajoutée !')
        resetSectionForm()
        onRefresh()
      } else {
        const data = await res.json()
        toast.error(data.error)
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setSectionLoading(false)
    }
  }

  const handleToggleSection = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/card-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      if (res.ok) {
        toast.success(active ? 'Section désactivée' : 'Section activée')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDeleteSection = async (id: string) => {
    setDeletingSectionId(id)
    try {
      const res = await fetch(`/api/card-sections?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Section supprimée. Les cartes ont été déplacées hors section.')
        onRefresh()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setDeletingSectionId(null)
    }
  }

  // Group cards by section
  const cardsBySection: Record<string, any[]> = {}
  const unassignedCards: any[] = []
  cards.forEach(card => {
    if (card.sectionId) {
      if (!cardsBySection[card.sectionId]) cardsBySection[card.sectionId] = []
      cardsBySection[card.sectionId].push(card)
    } else {
      unassignedCards.push(card)
    }
  })

  return (
    <div className="space-y-6">
      {/* Guide message for admin */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-cc-orange/5 border border-cc-orange/10">
        <Info className="w-4 h-4 text-cc-orange mt-0.5 shrink-0" />
        <div className="text-xs text-[#a89080]">
          <strong className="text-cc-orange">Cartes physiques &amp; Sections</strong> — Créez des sections (ex: « Cartes Orange », « Cartes MTN ») pour organiser vos cartes sur la page d&apos;accueil. Chaque section a un <strong>message guide</strong> qui s&apos;affiche pour aider le client. Vous pouvez télécharger les photos de vos cartes directement depuis votre ordinateur. Les clients peuvent ensuite acheter, payer via Wave ou Djamo, et recevoir le code par WhatsApp.
        </div>
      </div>

      {/* Sub-tabs: Sections / Cards */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className={subTab === 'sections' ? 'bg-cc-blue text-white' : 'bg-[#222222] text-[#a89080] hover:bg-[#2a2a2a] border border-white/[0.06]'}
          onClick={() => setSubTab('sections')}
        >
          <Store className="w-4 h-4 mr-1" /> Sections ({sections.length})
        </Button>
        <Button
          size="sm"
          className={subTab === 'cards' ? 'bg-cc-blue text-white' : 'bg-[#222222] text-[#a89080] hover:bg-[#2a2a2a] border border-white/[0.06]'}
          onClick={() => setSubTab('cards')}
        >
          <CreditCard className="w-4 h-4 mr-1" /> Cartes ({cards.length})
        </Button>
      </div>

      {/* ==================== SECTIONS TAB ==================== */}
      {subTab === 'sections' && (
        <div className="space-y-6">
          {/* Add section button */}
          {!showSectionForm && (
            <Button
              className="bg-gradient-to-r from-cc-orange to-orange-600 text-white btn-glow-orange"
              onClick={() => { resetSectionForm(); setShowSectionForm(true) }}
            >
              <Plus className="w-4 h-4 mr-1" /> Nouvelle section
            </Button>
          )}

          {/* Section Form */}
          {showSectionForm && (
            <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
                  {editingSection ? <Pencil className="w-5 h-5 text-cc-yellow" /> : <Plus className="w-5 h-5 text-cc-orange" />}
                  {editingSection ? 'Modifier la section' : 'Créer une section'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSection} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#a89080]">Titre de la section *</Label>
                      <Input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} placeholder="Ex: Cartes Orange" required className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#a89080]">Position (ordre d&apos;affichage)</Label>
                      <Input type="number" value={sectionPosition} onChange={e => setSectionPosition(e.target.value)} placeholder="0" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Message guide pour le client</Label>
                    <Textarea
                      value={sectionGuideMessage}
                      onChange={e => setSectionGuideMessage(e.target.value)}
                      placeholder="Ex: Sélectionnez votre carte Orange, payez via Djamo et recevez votre code par WhatsApp en quelques minutes !"
                      className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 min-h-[80px]"
                    />
                    <p className="text-[10px] text-[#a89080]/60">Ce message sera affiché sous le titre de la section pour guider le client dans son achat.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-cc-orange hover:bg-orange-600 text-white btn-glow-orange" disabled={sectionLoading}>
                      {sectionLoading ? 'Enregistrement...' : editingSection ? <><Save className="w-4 h-4 mr-1" /> Enregistrer</> : <><Plus className="w-4 h-4 mr-1" /> Créer la section</>}
                    </Button>
                    <Button type="button" variant="outline" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={resetSectionForm}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sections list */}
          <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#e5e2e1]">Sections de cartes ({sections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {sections.length === 0 && (
                    <div className="text-center py-8">
                      <Store className="w-10 h-10 text-[#a89080]/30 mx-auto mb-3" />
                      <p className="text-sm text-[#a89080]">Aucune section. Créez-en une pour organiser vos cartes.</p>
                    </div>
                  )}
                  {sections.sort((a: any, b: any) => a.position - b.position).map((section: any) => {
                    const sectionCards = cardsBySection[section.id] || []
                    return (
                      <div
                        key={section.id}
                        className={`py-4 px-4 rounded-xl border transition-smooth ${
                          !section.active ? 'border-white/[0.03] bg-white/[0.01] opacity-50' : 'border-white/[0.06] bg-[#222222]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cc-orange/10 flex items-center justify-center">
                              <Store className="w-4 h-4 text-cc-orange" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[#e5e2e1]">{section.title}</span>
                                <Badge variant="outline" className="text-[10px] border-white/[0.08] text-[#a89080]">Position: {section.position}</Badge>
                                {!section.active && (
                                  <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-500">Désactivée</Badge>
                                )}
                              </div>
                              {section.guideMessage && (
                                <p className="text-xs text-[#a89080]/70 line-clamp-1 mt-0.5">{section.guideMessage}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge className="bg-cc-blue/15 text-cc-blue text-[10px]">{sectionCards.length} carte{sectionCards.length !== 1 ? 's' : ''}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 ${section.active ? 'text-green-400 hover:bg-green-500/10' : 'text-[#a89080] hover:bg-white/5'}`}
                              onClick={() => handleToggleSection(section.id, section.active)}
                              title={section.active ? 'Désactiver' : 'Activer'}
                            >
                              {section.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-cc-yellow hover:bg-yellow-500/10"
                              onClick={() => startEditSection(section)}
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteSection(section.id)}
                              disabled={deletingSectionId === section.id}
                              title="Supprimer"
                            >
                              {deletingSectionId === section.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        {/* Cards in this section */}
                        {sectionCards.length > 0 && (
                          <div className="mt-3 space-y-2 pl-10">
                            {sectionCards.map(card => (
                              <div key={card.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-[#1a1a1a] border border-white/[0.04]">
                                <div className="w-8 h-8 rounded overflow-hidden bg-[#131313] shrink-0">
                                  {card.imageUrl ? (
                                    <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <CreditCard className="w-3 h-3 text-[#a89080]/30" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-[#e5e2e1] flex-1 min-w-0 truncate">{card.name}</span>
                                <span className="text-xs font-bold text-cc-yellow shrink-0">{formatCurrency(card.price)}</span>
                                <Select
                                  value={card.sectionId || 'none'}
                                  onValueChange={(val) => handleMoveCardToSection(card.id, val)}
                                >
                                  <SelectTrigger className="h-6 w-24 text-[10px] bg-[#131313] border-white/[0.06] text-[#a89080]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                                    <SelectItem value="none">Aucune</SelectItem>
                                    {sections.map((s: any) => (
                                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== CARDS TAB ==================== */}
      {subTab === 'cards' && (
        <div className="space-y-6">
          {/* Add/Edit Card Form */}
          <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
                {editingCard ? <Pencil className="w-5 h-5 text-cc-yellow" /> : <Plus className="w-5 h-5 text-cc-blue" />}
                {editingCard ? 'Modifier la carte' : 'Ajouter une carte physique'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCard} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Nom de la carte *</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Carte Orange 500F" required className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Prix (FCFA) *</Label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="500" required min={50} className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#a89080]">Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Carte de recharge physique. Grattez pour obtenir votre code." className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Opérateur</Label>
                    <Select value={operator} onValueChange={setOperator}>
                      <SelectTrigger className="bg-[#222222] border-white/[0.06] text-[#e5e2e1]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                        <SelectItem value="ALL">Tous</SelectItem>
                        <SelectItem value="ORANGE">Orange</SelectItem>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="MOOV">Moov</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Stock (-1 = ∞)</Label>
                    <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="-1" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Photo de la carte</Label>
                    <div className="flex items-center gap-2">
                      <label className={`flex items-center gap-2 px-4 h-10 rounded-xl cursor-pointer transition-smooth ${uploading ? 'bg-cc-blue/20 text-cc-blue/50 cursor-wait' : 'bg-[#222222] border border-white/[0.06] text-[#a89080] hover:border-cc-blue/30 hover:text-[#e5e2e1]'}`}>
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm">{uploading ? 'Téléchargement...' : 'Choisir une image'}</span>
                        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                      {imageUrl && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-red-400 hover:bg-red-500/10" onClick={() => setImageUrl('')}>
                          <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#a89080]/60">JPG, PNG, GIF ou WebP. Max 5MB.</p>
                    {imageUrl && !imageUrl.startsWith('/uploads/') && (
                      <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Ou entrez une URL" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 text-xs h-8" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#a89080]">Section</Label>
                    <Select value={cardSectionId} onValueChange={setCardSectionId}>
                      <SelectTrigger className="bg-[#222222] border-white/[0.06] text-[#e5e2e1]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                        <SelectItem value="none">Aucune section</SelectItem>
                        {sections.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Image preview */}
                {imageUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#222222] border border-white/[0.06]">
                    <img src={imageUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <span className="text-xs text-[#a89080]">Aperçu de la photo</span>
                      {imageUrl.startsWith('/uploads/') && (
                        <p className="text-[10px] text-green-400">✓ Image téléchargée depuis votre ordinateur</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="submit" className="bg-cc-blue hover:bg-blue-600 text-white btn-glow" disabled={loading}>
                    {loading ? 'Enregistrement...' : editingCard ? <><Save className="w-4 h-4 mr-1" /> Enregistrer</> : <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                  </Button>
                  {editingCard && (
                    <Button type="button" variant="outline" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={resetCardForm}>
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Cards list grouped by section */}
          <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#e5e2e1]">Cartes physiques ({cards.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-4">
                  {cards.length === 0 && (
                    <p className="text-sm text-[#a89080] text-center py-6">Aucune carte physique. Ajoutez-en une ci-dessus.</p>
                  )}

                  {/* Cards grouped by section */}
                  {sections.sort((a: any, b: any) => a.position - b.position).map((section: any) => {
                    const sectionCards = cardsBySection[section.id] || []
                    if (sectionCards.length === 0) return null
                    return (
                      <div key={section.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="w-4 h-4 text-cc-orange" />
                          <span className="text-sm font-semibold text-[#e5e2e1]">{section.title}</span>
                          <Badge className="bg-cc-orange/10 text-cc-orange text-[10px]">{sectionCards.length}</Badge>
                        </div>
                        <div className="space-y-2 pl-6">
                          {sectionCards.map(card => {
                            const opInfo = OPERATOR_INFO[card.operator] || null
                            return (
                              <div
                                key={card.id}
                                className={`flex items-center gap-4 py-3 px-4 rounded-xl border transition-smooth ${
                                  !card.active ? 'border-white/[0.03] bg-white/[0.01] opacity-50' : 'border-white/[0.06] bg-[#222222]'
                                }`}
                              >
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                                  {card.imageUrl ? (
                                    <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <CreditCard className="w-5 h-5 text-[#a89080]/30" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-medium text-sm text-[#e5e2e1]">{card.name}</span>
                                    {opInfo && (
                                      <Badge className={`${opInfo.bg} ${opInfo.color} text-xs`}>{opInfo.name}</Badge>
                                    )}
                                    {!card.active && (
                                      <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-500">Désactivée</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#a89080] line-clamp-1">{card.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-sm text-[#e5e2e1]">{formatCurrency(card.price)}</p>
                                  <p className="text-[10px] text-[#a89080]">Stock: {card.stock === -1 ? '∞' : card.stock}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${card.active ? 'text-green-400 hover:bg-green-500/10' : 'text-[#a89080] hover:bg-white/5'}`} onClick={() => handleToggleCard(card.id, card.active)} title={card.active ? 'Désactiver' : 'Activer'}>
                                    {card.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-cc-yellow hover:bg-yellow-500/10" onClick={() => startEditCard(card)} title="Modifier">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteCard(card.id)} disabled={deletingId === card.id} title="Supprimer">
                                    {deletingId === card.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Unassigned cards */}
                  {unassignedCards.length > 0 && (
                    <div>
                      {sections.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-[#a89080]" />
                          <span className="text-sm font-semibold text-[#a89080]">Sans section</span>
                          <Badge variant="outline" className="text-[10px] border-white/[0.08] text-[#a89080]">{unassignedCards.length}</Badge>
                        </div>
                      )}
                      <div className={`space-y-2 ${sections.length > 0 ? 'pl-6' : ''}`}>
                        {unassignedCards.map(card => {
                          const opInfo = OPERATOR_INFO[card.operator] || null
                          return (
                            <div
                              key={card.id}
                              className={`flex items-center gap-4 py-3 px-4 rounded-xl border transition-smooth ${
                                !card.active ? 'border-white/[0.03] bg-white/[0.01] opacity-50' : 'border-white/[0.06] bg-[#222222]'
                              }`}
                            >
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                                {card.imageUrl ? (
                                  <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-[#a89080]/30" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-sm text-[#e5e2e1]">{card.name}</span>
                                  {opInfo && (
                                    <Badge className={`${opInfo.bg} ${opInfo.color} text-xs`}>{opInfo.name}</Badge>
                                  )}
                                  {!card.active && (
                                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-500">Désactivée</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-[#a89080] line-clamp-1">{card.description}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-sm text-[#e5e2e1]">{formatCurrency(card.price)}</p>
                                <p className="text-[10px] text-[#a89080]">Stock: {card.stock === -1 ? '∞' : card.stock}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Select
                                  value={card.sectionId || 'none'}
                                  onValueChange={(val) => handleMoveCardToSection(card.id, val)}
                                >
                                  <SelectTrigger className="h-8 w-28 text-[10px] bg-[#1a1a1a] border-white/[0.06] text-[#a89080]">
                                    <SelectValue placeholder="Déplacer..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                                    <SelectItem value="none">Aucune section</SelectItem>
                                    {sections.map((s: any) => (
                                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${card.active ? 'text-green-400 hover:bg-green-500/10' : 'text-[#a89080] hover:bg-white/5'}`} onClick={() => handleToggleCard(card.id, card.active)} title={card.active ? 'Désactiver' : 'Activer'}>
                                  {card.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-cc-yellow hover:bg-yellow-500/10" onClick={() => startEditCard(card)} title="Modifier">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteCard(card.id)} disabled={deletingId === card.id} title="Supprimer">
                                  {deletingId === card.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
