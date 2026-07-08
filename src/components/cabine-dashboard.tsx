'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Phone, Users, CreditCard, BarChart3, Settings, TrendingUp,
  Smartphone, Palette, Wallet, RefreshCw, Plus, Check, X, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatCurrency, formatPhoneNumber, formatTransactionCode, stripFormatting } from '@/lib/commissions'
import { OPERATOR_INFO, THEME_OPTIONS } from '@/lib/constants'

export function CabineManagerDashboard({ token }: { token: string }) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [theme, setTheme] = useState('default')
  const [businessName, setBusinessName] = useState('')
  const [waveNumber, setWaveNumber] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!token) return
    try {
      const r = await fetch(`/api/cabine/${token}/dashboard`)
      const data = await r.json()
      setDashboardData(data)
      setTheme(data.manager?.theme || 'default')
      setBusinessName(data.manager?.businessName || '')
      setWaveNumber(data.manager?.waveNumber || '')
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadDashboard()
    }
  }, [token, loadDashboard])

  const handleSaveSettings = async () => {
    try {
      const managerId = dashboardData?.manager?.id
      if (!managerId) return
      const res = await fetch('/api/cabine', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: managerId, theme, businessName, waveNumber }),
      })
      if (res.ok) {
        toast.success('Paramètres sauvegardés !')
        loadDashboard()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur')
    }
  }

  if (loading) {
    return (
      <div className="pt-14 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4 bg-black min-h-screen">
        {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl bg-[#1a1a1a] animate-pulse" />)}
      </div>
    )
  }

  const manager = dashboardData?.manager
  const s = dashboardData?.stats

  return (
    <div className="pt-14 max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-black min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#e5e2e1]">
              {manager?.businessName || 'Ma Cabine'}
            </h1>
            <p className="text-[#a89080] text-sm">Bienvenue, {manager?.name}</p>
          </div>
          <Button variant="outline" size="sm" className="border-white/[0.06] text-[#a89080] hover:bg-white/5 hover:text-[#e5e2e1]" onClick={loadDashboard}>
            <RefreshCw className="w-4 h-4 mr-1" /> Actualiser
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap gap-1 mb-6 bg-[#1a1a1a] border border-white/[0.06]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><BarChart3 className="w-4 h-4 mr-1" /> Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Settings className="w-4 h-4 mr-1" /> Paramètres</TabsTrigger>
            <TabsTrigger value="sim" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Smartphone className="w-4 h-4 mr-1" /> SIM</TabsTrigger>
            <TabsTrigger value="wave" className="data-[state=active]:bg-cc-blue data-[state=active]:text-white"><Wallet className="w-4 h-4 mr-1" /> Wave</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CabineOverview stats={s} dashboardData={dashboardData} />
          </TabsContent>
          <TabsContent value="settings">
            <CabineTheme
              theme={theme} setTheme={setTheme}
              businessName={businessName} setBusinessName={setBusinessName}
              waveNumber={waveNumber} setWaveNumber={setWaveNumber}
              onSave={handleSaveSettings}
            />
          </TabsContent>
          <TabsContent value="sim">
            <CabineSIMManagement cabineId={manager?.id} simBalances={dashboardData?.simBalances} onRefresh={loadDashboard} />
          </TabsContent>
          <TabsContent value="wave">
            <CabineWavePayments cabineId={manager?.id} onRefresh={loadDashboard} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

function CabineOverview({ stats: s, dashboardData }: { stats: any; dashboardData: any }) {
  if (!s) return null

  const statCards = [
    { label: 'Recharges', value: s.totalRecharges || 0, sub: formatCurrency(s.totalRechargeAmount || 0), icon: Phone, color: 'text-primary-glow' },
    { label: 'Commissions', value: formatCurrency(s.totalCommission || 0), sub: 'Vos gains', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Souscriptions', value: s.totalSubscriptions || 0, sub: formatCurrency(s.totalSubscriptionAmount || 0), icon: CreditCard, color: 'text-secondary-dim' },
    { label: 'Clients', value: s.totalClients || 0, sub: `${s.pendingWavePayments || 0} paiements Wave en attente`, icon: Users, color: 'text-tertiary-dim' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
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

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader><CardTitle className="text-base text-[#e5e2e1]">Dernières recharges</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {(dashboardData?.recentRecharges || []).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`${OPERATOR_INFO[r.operator]?.bg} ${OPERATOR_INFO[r.operator]?.color} text-xs`}>
                        {r.operator}
                      </Badge>
                      <span className="text-sm text-[#e5e2e1]">{r.clientName}</span>
                    </div>
                    <span className="text-sm font-bold text-[#e5e2e1]">{formatCurrency(r.amount)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
          <CardHeader><CardTitle className="text-base text-[#e5e2e1]">Dernières souscriptions</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {(dashboardData?.recentSubscriptions || []).map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`${OPERATOR_INFO[sub.operator]?.bg} ${OPERATOR_INFO[sub.operator]?.color} text-xs`}>
                        {sub.operator}
                      </Badge>
                      <span className="text-sm text-[#e5e2e1]">{sub.planName}</span>
                    </div>
                    <span className="text-sm font-bold text-[#e5e2e1]">{formatCurrency(sub.amount)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CabineTheme({ theme, setTheme, businessName, setBusinessName, waveNumber, setWaveNumber, onSave }: {
  theme: string; setTheme: (v: string) => void
  businessName: string; setBusinessName: (v: string) => void
  waveNumber: string; setWaveNumber: (v: string) => void
  onSave: () => void
}) {
  return (
    <Card className="max-w-lg bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
          <Palette className="w-5 h-5 text-cc-blue" />
          Personnaliser ma cabine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[#a89080]">Nom du commerce</Label>
          <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Nom de votre commerce" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
        </div>

        <div className="space-y-2">
          <Label className="text-[#a89080]">Numéro Wave</Label>
          <Input value={waveNumber} onChange={e => setWaveNumber(e.target.value)} placeholder="01XXXXXXXX" className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" />
          <p className="text-xs text-[#a89080]">Ce numéro sera affiché aux clients pour les paiements Wave</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[#a89080]">Thème</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-xl border-2 transition-smooth text-left ${
                  theme === t.id ? 'border-cc-blue shadow-md shadow-cc-blue/20' : 'border-white/[0.06] hover:border-cc-blue/30 bg-[#222222]'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primary }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.secondary }} />
                </div>
                <p className="text-sm font-medium text-[#e5e2e1]">{t.name}</p>
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full bg-cc-blue hover:bg-blue-600 text-white btn-glow" onClick={onSave}>
          <Settings className="w-4 h-4 mr-2" /> Sauvegarder les paramètres
        </Button>
      </CardContent>
    </Card>
  )
}

function CabineSIMManagement({ cabineId, simBalances, onRefresh }: { cabineId: string; simBalances: any[]; onRefresh: () => void }) {
  const [operator, setOperator] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionNumbers, setTransactionNumbers] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTxInput, setShowTxInput] = useState<string | null>(null)
  const [newTxNumber, setNewTxNumber] = useState('')
  const [copiedTx, setCopiedTx] = useState<string | null>(null)

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

  const handleAddSim = async (e: React.FormEvent) => {
    e.preventDefault()
    const rawPhone = stripFormatting(phoneNumber)
    if (!operator || !rawPhone) return
    setLoading(true)
    try {
      const rawTxNumbers = transactionNumbers
        .split(',')
        .map(t => stripFormatting(t.trim()))
        .filter(Boolean)
        .join(',')

      const res = await fetch('/api/sim-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator, phoneNumber: rawPhone, balance: 0, cabineId, transactionNumbers: rawTxNumbers }),
      })
      if (res.ok) {
        toast.success('SIM ajoutée !')
        setOperator(''); setPhoneNumber(''); setTransactionNumbers('')
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

  const handleRechargeSim = async (id: string) => {
    if (!amount) { toast.error('Entrez un montant'); return }
    try {
      const res = await fetch('/api/sim-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount: parseInt(amount) }),
      })
      if (res.ok) {
        toast.success('SIM rechargée !')
        setAmount('')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  // Add a transaction number to an existing SIM
  const handleAddTxNumber = async (simId: string) => {
    if (!newTxNumber.trim()) return
    const rawCode = stripFormatting(newTxNumber.trim())
    if (!rawCode) { toast.error('Numéro de transaction requis'); return }
    try {
      const res = await fetch('/api/sim-balances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: simId, transactionNumbers: `+${rawCode}` }),
      })
      if (res.ok) {
        toast.success('Numéro de transaction ajouté !')
        setNewTxNumber('')
        setShowTxInput(null)
        onRefresh()
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
    const sim = simBalances.find((s: any) => s.id === simId)
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
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
            <Smartphone className="w-5 h-5 text-cc-blue" />
            Ajouter une puce SIM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSim} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger className="bg-[#222222] border-white/[0.06] text-[#e5e2e1]"><SelectValue placeholder="Opérateur" /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/[0.06]">
                  <SelectItem value="ORANGE">Orange</SelectItem>
                  <SelectItem value="MTN">MTN</SelectItem>
                  <SelectItem value="MOOV">Moov</SelectItem>
                </SelectContent>
              </Select>
              <div className="space-y-1">
                <Input
                  value={phoneNumber}
                  onChange={e => handlePhoneInput(e.target.value)}
                  placeholder="07 XX XX XX XX"
                  required
                  className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 font-mono tracking-wider"
                />
                <p className="text-[10px] text-[#a89080]/60">Format automatique</p>
              </div>
              <Button type="submit" className="bg-cc-blue hover:bg-blue-600 text-white btn-glow" disabled={loading}>
                {loading ? 'Ajout...' : <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
              </Button>
            </div>
            <div className="space-y-1">
              <Label className="text-[#a89080]">Numéros de transaction / codes de recharge</Label>
              <Input
                value={transactionNumbers}
                onChange={e => {
                  const codes = e.target.value.split(',')
                  const formatted = codes.map(code => {
                    const clean = code.trim().replace(/[^a-zA-Z0-9]/g, '')
                    return clean ? formatTransactionCode(clean) : ''
                  }).join(', ')
                  setTransactionNumbers(formatted)
                }}
                placeholder="Ex: 1234-5678-9012, 9876-5432-1098"
                className="bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 font-mono tracking-wider"
              />
              <p className="text-[10px] text-[#a89080]/60">Séparez les codes par des virgules. Séparateurs automatiques.</p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base text-[#e5e2e1]">Solde des puces SIM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(simBalances || []).map((sim: any) => {
              const txNumbers = (sim.transactionNumbers || '').split(',').filter(Boolean)
              const formattedPhone = formatPhoneNumber(sim.phoneNumber)
              return (
                <div key={sim.id} className="py-3 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={`${OPERATOR_INFO[sim.operator]?.bg} ${OPERATOR_INFO[sim.operator]?.color}`}>
                        {sim.operator}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-mono font-medium text-[#e5e2e1] tracking-wide">{formattedPhone}</p>
                          <button
                            onClick={() => handleCopyTx(sim.phoneNumber)}
                            className="p-0.5 hover:bg-white/5 rounded transition-smooth"
                            title="Copier le numéro"
                          >
                            {copiedTx === sim.phoneNumber ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-[#a89080]" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#a89080]">Solde: <strong className="text-green-500">{formatCurrency(sim.balance)}</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" placeholder="Montant" className="w-24 h-8 text-sm bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50" value={amount} onChange={e => setAmount(e.target.value)} />
                      <Button size="sm" variant="outline" className="border-white/[0.06] text-[#a89080] hover:bg-white/5" onClick={() => handleRechargeSim(sim.id)}>
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Transaction numbers */}
                  {txNumbers.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-[#1a1a1a] border border-white/[0.04]">
                      <p className="text-[10px] uppercase tracking-widest text-[#a89080] mb-1.5">Numéros de transaction</p>
                      <div className="flex flex-wrap gap-1.5">
                        {txNumbers.map((code: string, idx: number) => {
                          const formattedCode = formatTransactionCode(code)
                          return (
                            <div key={idx} className="group flex items-center gap-1 px-2 py-1 rounded-md bg-[#2a2a2a] border border-white/[0.06] hover:border-cc-blue/30 transition-smooth">
                              <span className="text-xs font-mono font-bold text-cc-blue tracking-wider">{formattedCode}</span>
                              <button onClick={() => handleCopyTx(code)} className="opacity-60 group-hover:opacity-100 p-0.5 hover:bg-white/5 rounded transition-smooth" title="Copier">
                                {copiedTx === code ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-[#a89080]" />}
                              </button>
                              <button onClick={() => handleDeleteTxNumber(sim.id, code)} className="opacity-60 group-hover:opacity-100 p-0.5 hover:bg-red-500/10 rounded transition-smooth" title="Supprimer">
                                <X className="w-2.5 h-2.5 text-red-400" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add transaction number */}
                  {showTxInput === sim.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={newTxNumber}
                        onChange={e => handleTxNumberInput(e.target.value)}
                        placeholder="1234-5678-9012"
                        className="flex-1 h-8 text-sm bg-[#222222] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50 font-mono tracking-wider"
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); handleAddTxNumber(sim.id) }
                        }}
                      />
                      <Button size="sm" className="bg-cc-blue hover:bg-blue-600 text-white h-8 text-xs" onClick={() => handleAddTxNumber(sim.id)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-[#a89080] h-8" onClick={() => { setShowTxInput(null); setNewTxNumber('') }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cc-blue/20 text-cc-blue hover:bg-cc-blue/10 h-7 text-xs mt-2"
                      onClick={() => setShowTxInput(sim.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Ajouter numéro
                    </Button>
                  )}
                </div>
              )
            })}
            {(!simBalances || simBalances.length === 0) && (
              <p className="text-center text-[#a89080] py-4">Aucune puce SIM enregistrée</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CabineWavePayments({ cabineId, onRefresh }: { cabineId: string; onRefresh: () => void }) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cabineId) return
    fetch(`/api/wave-payments?cabineId=${cabineId}`)
      .then(r => r.json())
      .then(data => { setPayments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cabineId])

  const handleConfirm = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/wave-payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(status === 'CONFIRMED' ? 'Paiement confirmé !' : 'Paiement annulé')
        fetch(`/api/wave-payments?cabineId=${cabineId}`)
          .then(r => r.json())
          .then(setPayments)
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  if (loading) {
    return <div className="h-40 rounded-xl bg-[#1a1a1a] animate-pulse" />
  }

  return (
    <Card className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-[#e5e2e1]">
          <Wallet className="w-5 h-5 text-cc-blue" />
          Paiements Wave
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-96">
          <div className="space-y-3">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="font-medium text-sm text-[#e5e2e1]">{p.clientName}</p>
                  <p className="text-xs text-[#a89080]">{p.clientPhone} — {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#e5e2e1]">{formatCurrency(p.amount)}</span>
                  {p.status === 'PENDING' ? (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs" onClick={() => handleConfirm(p.id, 'CONFIRMED')}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleConfirm(p.id, 'CANCELLED')}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant={p.status === 'CONFIRMED' ? 'default' : 'destructive'} className="text-xs">
                      {p.status === 'CONFIRMED' ? 'Confirmé' : 'Annulé'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-center text-[#a89080] py-4">Aucun paiement Wave pour le moment</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
