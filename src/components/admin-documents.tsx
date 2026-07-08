'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, RefreshCw, Search, Download, Trash2, Send, Upload,
  Loader2, X, FileCheck, Clock, Phone, Mail, MapPin, Hash,
  Filter, Eye, ChevronDown, AlertCircle, Pencil, FileArchive, FileType2, FileImage,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// ==========================================
// CONSTANTS
// ==========================================
const STATUS_OPTIONS = [
  { value: 'RECEIVED', label: 'Reçu', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'IN_PROGRESS', label: 'En cours de traitement', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'AWAITING_PAYMENT', label: 'En attente de paiement', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'DELIVERED', label: 'Livré', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-700 border-red-200' },
]

const SERVICE_LABELS: Record<string, string> = {
  TRAITEMENT_TEXTE: 'Traitement de texte',
  SAISIE: 'Saisie de documents manuscrits',
  MISE_EN_PAGE: 'Mise en page professionnelle',
  CORRECTION: 'Correction de documents',
  CV_LETTRE: 'CV et lettre de motivation',
  MEMOIRE_RAPPORT: 'Mémoire, rapport, thèse',
  DOC_ADMIN: 'Documents administratifs',
  IMPRESSION: 'Impression de documents',
  NUMERISATION: 'Numérisation (scan)',
  PHOTOCOPIE: 'Photocopie',
  CONCEPTION: 'Conception de documents personnalisés',
  AUTRE: 'Autre',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) return FileImage
  if (['zip', 'rar', '7z'].includes(ext || '')) return FileArchive
  return FileType2
}

function safeParseFiles(filesStr: string): any[] {
  try {
    const parsed = JSON.parse(filesStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ==========================================
// MAIN ADMIN DOCUMENTS COMPONENT
// ==========================================
export function AdminDocuments() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/document-requests?${params.toString()}`)
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleView = (req: any) => {
    setSelected(req)
    setDetailOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cette demande ?')) return
    try {
      const res = await fetch(`/api/document-requests?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Demande supprimée')
      load()
      if (selected?.id === id) setDetailOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Filter by search
  const filtered = requests.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      r.trackingCode?.toLowerCase().includes(q) ||
      r.clientName?.toLowerCase().includes(q) ||
      r.clientPhone?.toLowerCase().includes(q) ||
      r.clientEmail?.toLowerCase().includes(q)
    )
  })

  // Stats
  const stats = {
    total: requests.length,
    received: requests.filter((r) => r.status === 'RECEIVED').length,
    inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
    awaiting: requests.filter((r) => r.status === 'AWAITING_PAYMENT').length,
    delivered: requests.filter((r) => r.status === 'DELIVERED').length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#e5e2e1] flex items-center gap-2">
            <FileText className="w-5 h-5 text-cc-orange" />
            Documents à Traiter
          </h2>
          <p className="text-sm text-[#a89080]">
            Gérez les demandes de traitement de documents envoyées par les clients
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="border-white/[0.06] text-[#a89080] hover:bg-white/5 hover:text-[#e5e2e1]">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Actualiser
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#e5e2e1]', bg: 'bg-[#1a1a1a]' },
          { label: 'Reçues', value: stats.received, color: 'text-blue-400', bg: 'bg-blue-950/30' },
          { label: 'En cours', value: stats.inProgress, color: 'text-amber-400', bg: 'bg-amber-950/30' },
          { label: 'À payer', value: stats.awaiting, color: 'text-orange-400', bg: 'bg-orange-950/30' },
          { label: 'Livré', value: stats.delivered, color: 'text-green-400', bg: 'bg-green-950/30' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-white/[0.06] rounded-xl p-3`}>
            <p className="text-xs text-[#a89080]">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a89080]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code, nom, téléphone, email…"
            className="pl-9 bg-[#1a1a1a] border-white/[0.06] text-[#e5e2e1] placeholder:text-[#a89080]/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-[#1a1a1a] border-white/[0.06] text-[#e5e2e1]">
            <Filter className="w-4 h-4 mr-1.5 text-[#a89080]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#1a1a1a] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#a89080]">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune demande trouvée</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((req, i) => {
            const filesList = req.filesList || safeParseFiles(req.files || '[]')
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === req.status)
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Left: tracking + client */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-sm font-mono font-bold text-cc-orange">{req.trackingCode}</span>
                      <Badge variant="outline" className={`text-xs ${statusInfo?.color || ''}`}>
                        {statusInfo?.label || req.status}
                      </Badge>
                      <span className="text-xs text-[#a89080]">{formatDate(req.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-sm">
                      <span className="font-medium text-[#e5e2e1]">{req.clientName}</span>
                      <span className="text-[#a89080] text-xs flex items-center gap-1">
                        <Phone className="w-3 h-3" />{req.clientPhone}
                      </span>
                      <span className="text-[#a89080] text-xs">
                        {SERVICE_LABELS[req.serviceType] || req.serviceType}
                        {req.serviceType === 'AUTRE' && req.serviceTypeOther ? ` — ${req.serviceTypeOther}` : ''}
                      </span>
                      <span className="text-[#a89080] text-xs flex items-center gap-1">
                        <FileText className="w-3 h-3" />{filesList.length} fichier(s)
                      </span>
                    </div>
                    {req.quoteAmount != null && req.quoteAmount > 0 && (
                      <p className="text-xs text-cc-orange font-semibold mt-1">
                        Devis : {formatCurrency(req.quoteAmount)} {req.quoteDelay && `• Délai : ${req.quoteDelay}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleView(req)} className="border-white/[0.06] text-[#a89080] hover:bg-white/5 hover:text-[#e5e2e1]">
                      <Eye className="w-3.5 h-3.5 mr-1" /> Détails
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(req.id)} className="border-white/[0.06] text-red-400 hover:bg-red-950/30 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <DocumentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        request={selected}
        onUpdate={(updated) => {
          setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
          setSelected(updated)
        }}
      />
    </div>
  )
}

// ==========================================
// DETAIL DIALOG
// ==========================================
function DocumentDetailDialog({
  open,
  onOpenChange,
  request,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: any | null
  onUpdate: (updated: any) => void
}) {
  const [status, setStatus] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteDelay, setQuoteDelay] = useState('')
  const [quoteNote, setQuoteNote] = useState('')
  const [finalDocumentUrl, setFinalDocumentUrl] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingFinal, setUploadingFinal] = useState(false)

  useEffect(() => {
    if (request) {
      setStatus(request.status || '')
      setQuoteAmount(request.quoteAmount != null ? String(request.quoteAmount) : '')
      setQuoteDelay(request.quoteDelay || '')
      setQuoteNote(request.quoteNote || '')
      setFinalDocumentUrl(request.finalDocumentUrl || '')
      setAdminNote(request.adminNote || '')
    }
  }, [request])

  if (!request) return null

  const filesList = request.filesList || safeParseFiles(request.files || '[]')

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: any = { id: request.id }
      if (status !== request.status) body.status = status
      if (quoteAmount !== (request.quoteAmount != null ? String(request.quoteAmount) : '')) {
        body.quoteAmount = quoteAmount === '' ? null : parseInt(quoteAmount, 10)
      }
      if (quoteDelay !== request.quoteDelay) body.quoteDelay = quoteDelay
      if (quoteNote !== request.quoteNote) body.quoteNote = quoteNote
      if (finalDocumentUrl !== request.finalDocumentUrl) body.finalDocumentUrl = finalDocumentUrl
      if (adminNote !== request.adminNote) body.adminNote = adminNote

      const res = await fetch('/api/document-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur')
      }
      const updated = await res.json()
      onUpdate(updated)
      toast.success('Demande mise à jour')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadFinal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFinal(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'documents-final')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload échoué')
      const data = await res.json()
      setFinalDocumentUrl(data.url)
      toast.success('Document final téléversé')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du téléversement')
    } finally {
      setUploadingFinal(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 bg-[#1a1a1a] border-white/[0.08]">
        <DialogHeader className="px-5 py-4 border-b border-white/[0.06]">
          <DialogTitle className="text-[#e5e2e1] flex items-center gap-2">
            <FileText className="w-5 h-5 text-cc-orange" />
            <span className="font-mono">{request.trackingCode}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-130px)]">
          <div className="p-5 space-y-5">
            {/* Client info */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a89080] mb-2">Client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <InfoRow icon={FileText} label="Nom" value={request.clientName} />
                <InfoRow icon={Phone} label="Téléphone" value={request.clientPhone} />
                <InfoRow icon={Mail} label="Email" value={request.clientEmail || '—'} />
                <InfoRow icon={MapPin} label="Adresse" value={request.deliveryAddress || '—'} />
              </div>
            </section>

            {/* Service info */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a89080] mb-2">Service demandé</h3>
              <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#a89080]">Type :</span>
                  <span className="text-[#e5e2e1] font-medium">
                    {SERVICE_LABELS[request.serviceType] || request.serviceType}
                    {request.serviceType === 'AUTRE' && request.serviceTypeOther ? ` — ${request.serviceTypeOther}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a89080]">Livraison :</span>
                  <span className="text-[#e5e2e1] font-medium">
                    {request.deliveryMode === 'DIGITAL' ? 'Numérique' : request.deliveryMode === 'PHYSICAL' ? 'Physique à domicile' : 'Retrait en local'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a89080]">Reçue le :</span>
                  <span className="text-[#e5e2e1] font-medium">{formatDate(request.createdAt)}</span>
                </div>
                {request.description && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[#a89080] mb-1">Description :</p>
                    <p className="text-[#e5e2e1] whitespace-pre-wrap">{request.description}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Files */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a89080] mb-2">
                Fichiers envoyés ({filesList.length})
              </h3>
              {filesList.length === 0 ? (
                <p className="text-sm text-[#a89080]">Aucun fichier joint</p>
              ) : (
                <div className="space-y-2">
                  {filesList.map((f: any, idx: number) => {
                    const Icon = getFileIcon(f.name || '')
                    return (
                      <a
                        key={idx}
                        href={f.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0f0f0f] border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cc-blue/15 to-cc-orange/15 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-cc-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#e5e2e1] truncate">{f.name}</p>
                          <p className="text-xs text-[#a89080]">{f.size ? formatFileSize(f.size) : ''}</p>
                        </div>
                        <Download className="w-4 h-4 text-[#a89080] group-hover:text-cc-orange transition-colors shrink-0" />
                      </a>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Admin actions */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a89080] mb-2">Traitement administrateur</h3>
              <div className="space-y-3">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-[#a89080] text-xs">Statut de la demande</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-[#0f0f0f] border-white/[0.06] text-[#e5e2e1]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quote */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#a89080] text-xs">Montant du devis (FCFA)</Label>
                    <Input
                      type="number"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      placeholder="ex : 5000"
                      className="bg-[#0f0f0f] border-white/[0.06] text-[#e5e2e1]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#a89080] text-xs">Délai estimé</Label>
                    <Input
                      value={quoteDelay}
                      onChange={(e) => setQuoteDelay(e.target.value)}
                      placeholder="ex : 24h, 2 jours"
                      className="bg-[#0f0f0f] border-white/[0.06] text-[#e5e2e1]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#a89080] text-xs">Note du devis (visible par le client)</Label>
                  <Textarea
                    value={quoteNote}
                    onChange={(e) => setQuoteNote(e.target.value)}
                    placeholder="Précisions sur le devis, options incluses…"
                    className="bg-[#0f0f0f] border-white/[0.06] text-[#e5e2e1] min-h-[60px]"
                  />
                </div>

                {/* Final document */}
                <div className="space-y-1.5">
                  <Label className="text-[#a89080] text-xs">Document final à livrer</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={finalDocumentUrl}
                      onChange={(e) => setFinalDocumentUrl(e.target.value)}
                      placeholder="URL du document final (ou téléversez ↓)"
                      className="bg-[#0f0f0f] border-white/[0.06] text-[#e5e2e1] flex-1"
                    />
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" onChange={handleUploadFinal} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png" />
                      <span className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-cc-orange/15 text-cc-orange border border-cc-orange/30 hover:bg-cc-orange/25 transition-colors text-sm font-medium whitespace-nowrap">
                        {uploadingFinal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Téléverser
                      </span>
                    </label>
                  </div>
                  {finalDocumentUrl && (
                    <a href={finalDocumentUrl} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cc-orange hover:underline mt-1">
                      <Download className="w-3 h-3" /> Télécharger / prévisualiser
                    </a>
                  )}
                </div>

                {/* Admin note */}
                <div className="space-y-1.5">
                  <Label className="text-[#a89080] text-xs">Note interne (admin)</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Notes privées…"
                    className="bg-[#0f0f0f] border-white/[0.06] text-[#e5e2e1] min-h-[50px]"
                  />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="px-5 py-4 border-t border-white/[0.06] bg-[#0f0f0f]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/[0.06] text-[#a89080] hover:bg-white/5 hover:text-[#e5e2e1]">
            Fermer
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-cc-orange to-orange-600 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#0f0f0f] border border-white/[0.06] rounded-lg px-3 py-2">
      <Icon className="w-4 h-4 text-[#a89080] shrink-0" />
      <span className="text-[#a89080] text-xs">{label} :</span>
      <span className="text-[#e5e2e1] text-sm font-medium truncate">{value}</span>
    </div>
  )
}
