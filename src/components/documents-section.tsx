'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, Loader2, Search, Trash2,
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
import { toast } from 'sonner'

// ==========================================
// CONSTANTS
// ==========================================

const SERVICE_OPTIONS = [
  { value: 'TRAITEMENT_TEXTE', label: 'Traitement de texte', description: 'Mise en forme professionnelle de tous vos documents.' },
  { value: 'SAISIE', label: 'Saisie de documents manuscrits', description: 'Conversion rapide en document numérique.' },
  { value: 'MISE_EN_PAGE', label: 'Mise en page professionnelle', description: 'Présentation élégante et conforme.' },
  { value: 'CORRECTION', label: 'Correction de documents', description: 'Orthographe, grammaire et mise en forme.' },
  { value: 'CV_LETTRE', label: 'CV et lettre de motivation', description: 'Des documents professionnels pour réussir vos candidatures.' },
  { value: 'MEMOIRE_RAPPORT', label: 'Mémoire, rapport, thèse', description: 'Respect des normes académiques.' },
  { value: 'DOC_ADMIN', label: 'Documents administratifs', description: 'Courriers, attestations et formulaires.' },
  { value: 'IMPRESSION', label: 'Impression de documents', description: 'Impression couleur et noir & blanc.' },
  { value: 'NUMERISATION', label: 'Numérisation (scan)', description: 'Scan haute qualité avec livraison numérique.' },
  { value: 'PHOTOCOPIE', label: 'Photocopie', description: 'Reproduction fidèle de vos documents.' },
  { value: 'CONCEPTION', label: 'Conception de documents personnalisés', description: 'Créations sur mesure selon vos besoins.' },
  { value: 'AUTRE', label: 'Autre', description: 'Un besoin spécifique ? Parlons-en.' },
] as const

const DELIVERY_MODES = [
  {
    value: 'DIGITAL',
    label: 'Livraison numérique',
    desc: 'WhatsApp, Email ou téléchargement',
  },
  {
    value: 'PHYSICAL',
    label: 'Livraison physique à domicile',
    desc: 'Nous livrons à votre adresse',
  },
  {
    value: 'PICKUP',
    label: 'Retrait dans nos locaux',
    desc: 'Récupérez votre commande chez nous',
  },
] as const

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.txt'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 Mo
const MAX_FILES = 10

// ==========================================
// HELPER: format file size
// ==========================================
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function getFileIcon(name: string) {
  return null
}

// ==========================================
// MAIN SECTION (LANDING)
// ==========================================
export function DocumentsSection() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [trackingOpen, setTrackingOpen] = useState(false)

  return (
    <section id="section-documents" className="relative py-24 sm:py-32 bg-cc-page-bg overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cc-page-bg via-cc-surface-container-high to-cc-page-bg pointer-events-none" />
      <div className="absolute top-0 right-0 w-[36rem] h-[36rem] bg-cc-orange/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-cc-blue/[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cc-orange/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-14 lg:gap-20 items-center">
          {/* LEFT: text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase text-cc-text-secondary bg-cc-surface-container border border-cc-border/70 shadow-sm mb-7">
              Documents à traiter
            </span>

            <h2 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold text-cc-text-primary mb-6 leading-[1.08] tracking-tight">
              Confiez-nous vos documents{' '}
              <span className="text-cc-orange">en toute simplicité</span>
            </h2>

            <p className="text-lg text-cc-text-secondary/90 mb-9 leading-relaxed max-w-lg font-light">
              Envoyez vos documents en ligne et notre équipe se charge du reste : saisie,
              traitement de texte, mise en page, impression, correction, numérisation et bien
              plus encore.
            </p>

            <div className="flex flex-wrap gap-2.5 mb-10">
              {[
                'Traitement rapide',
                'Livraison numérique ou physique',
                'Paiement sécurisé',
                'Service professionnel',
                'Suivi en temps réel',
              ].map((text) => (
                <span
                  key={text}
                  className="text-[13px] font-medium text-cc-text-primary/80 bg-cc-surface-container border border-cc-border/60 rounded-full px-4 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                >
                  {text}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5">
              <motion.button
                whileHover={{ y: -2, boxShadow: '0 16px 32px -8px rgba(255,122,26,0.38)' }}
                whileTap={{ y: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => setOverlayOpen(true)}
                className="bg-cc-orange text-white rounded-2xl h-[52px] px-8 text-[15px] font-semibold shadow-[0_10px_24px_-6px_rgba(255,122,26,0.35)]"
              >
                Envoyer mon document
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.35)' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => setTrackingOpen(true)}
                className="bg-cc-surface-container border border-cc-border text-cc-text-primary rounded-2xl h-[52px] px-8 text-[15px] font-semibold"
              >
                Suivre ma demande
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT: service cards grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICE_OPTIONS.slice(0, 9).map((opt, i) => (
                <motion.div
                  key={opt.value}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -5 }}
                  onClick={() => setOverlayOpen(true)}
                  className="group cursor-pointer bg-cc-surface-container border border-cc-border/70 rounded-[22px] px-6 py-8 flex flex-col items-center text-center gap-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.12)] hover:border-cc-orange/40 hover:bg-cc-orange/[0.04]"
                >
                  <h3 className="text-[15px] font-semibold text-cc-text-primary leading-snug">
                    {opt.label}
                  </h3>
                  <p className="text-[13px] text-cc-text-secondary/80 leading-relaxed font-light">
                    {opt.description}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <span className="inline-flex items-center text-[13px] font-medium text-cc-text-secondary bg-cc-surface-container border border-dashed border-cc-border rounded-full px-5 py-2">
                + Photocopie, conception personnalisée et bien plus encore
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* OVERLAY (form) */}
      <DocumentRequestOverlay open={overlayOpen} onOpenChange={setOverlayOpen} />

      {/* TRACKING DIALOG */}
      <DocumentTrackingDialog open={trackingOpen} onOpenChange={setTrackingOpen} />
    </section>
  )
}

// ==========================================
// DOCUMENT REQUEST OVERLAY (FORM)
// ==========================================
interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
}

interface DocumentRequestOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DocumentRequestOverlay({ open, onOpenChange }: DocumentRequestOverlayProps) {
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form')
  const [trackingCode, setTrackingCode] = useState<string>('')

  // form state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [serviceType, setServiceType] = useState<string>('')
  const [serviceTypeOther, setServiceTypeOther] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<string>('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep('form')
        setTrackingCode('')
        setClientName('')
        setClientPhone('')
        setClientEmail('')
        setDeliveryAddress('')
        setServiceType('')
        setServiceTypeOther('')
        setDeliveryMode('')
        setDescription('')
        setFiles([])
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // Lock body scroll
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const incoming = Array.from(fileList)

    // validate count
    if (files.length + incoming.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} fichiers par demande`)
      return
    }

    // validate size and types
    const valid: File[] = []
    for (const f of incoming) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} dépasse 100 Mo`)
        continue
      }
      valid.push(f)
    }

    if (valid.length === 0) return

    setUploading(true)
    try {
      const uploaded: UploadedFile[] = []
      for (const f of valid) {
        const formData = new FormData()
        formData.append('file', f)
        formData.append('folder', 'documents')
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast.error(`${f.name}: ${err.error || 'Échec du téléversement'}`)
          continue
        }
        const data = await res.json()
        uploaded.push({
          url: data.url,
          name: data.name || f.name,
          size: data.size || f.size,
          type: data.type || f.type || 'application/octet-stream',
        })
      }
      if (uploaded.length > 0) {
        setFiles((prev) => [...prev, ...uploaded])
        toast.success(`${uploaded.length} fichier(s) ajouté(s)`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du téléversement')
    } finally {
      setUploading(false)
    }
  }, [files.length])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    // validations
    if (!clientName.trim()) return toast.error('Veuillez saisir votre nom')
    if (!clientPhone.trim()) return toast.error('Veuillez saisir votre numéro de téléphone')
    if (!serviceType) return toast.error('Veuillez choisir un type de service')
    if (serviceType === 'AUTRE' && !serviceTypeOther.trim()) {
      return toast.error('Veuillez préciser le type de service (Autre)')
    }
    if (!deliveryMode) return toast.error('Veuillez choisir un mode de livraison')
    if (deliveryMode === 'PHYSICAL' && !deliveryAddress.trim()) {
      return toast.error('Veuillez saisir votre adresse de livraison')
    }

    setStep('submitting')
    try {
      const res = await fetch('/api/document-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim(),
          deliveryAddress: deliveryAddress.trim(),
          serviceType,
          serviceTypeOther: serviceTypeOther.trim(),
          deliveryMode,
          description: description.trim(),
          files,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Échec de la soumission')
      }
      const data = await res.json()
      setTrackingCode(data.trackingCode)
      setStep('success')
      toast.success('Votre demande a bien été envoyée !')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de la soumission')
      setStep('form')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-cc-surface-container rounded-2xl shadow-2xl w-full max-w-3xl my-4 sm:my-8 border border-cc-border"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-cc-orange to-cc-orange/90 text-white px-5 sm:px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">Envoyer un document</h2>
                  <p className="text-xs sm:text-sm text-white/80 truncate">Confiez-nous vos documents en toute simplicité</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 max-h-[calc(100vh-220px)] overflow-y-auto">
              {step === 'success' ? (
                <SuccessScreen
                  trackingCode={trackingCode}
                  clientName={clientName}
                  onClose={() => onOpenChange(false)}
                />
              ) : (
                <div className="space-y-6">
                  {/* Section: Informations client */}
                  <FormSection title="Vos informations">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="doc-name">Nom et prénom <span className="text-red-500">*</span></Label>
                        <Input
                          id="doc-name"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Ex : Aya Koffi"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="doc-phone">Téléphone <span className="text-red-500">*</span></Label>
                        <Input
                          id="doc-phone"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Ex : 07 08 72 59 39"
                          inputMode="tel"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="doc-email">Adresse e-mail</Label>
                        <Input
                          id="doc-email"
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="votre@email.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="doc-address">Adresse de livraison (optionnelle)</Label>
                        <Input
                          id="doc-address"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Quartier, commune, ville"
                        />
                      </div>
                    </div>
                  </FormSection>

                  {/* Section: Type de service */}
                  <FormSection title="Type de service demandé">
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisissez un service…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {SERVICE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {serviceType === 'AUTRE' && (
                      <Input
                        className="mt-3"
                        value={serviceTypeOther}
                        onChange={(e) => setServiceTypeOther(e.target.value)}
                        placeholder="Précisez le type de service…"
                      />
                    )}
                  </FormSection>

                  {/* Section: Mode de livraison */}
                  <FormSection title="Mode de livraison">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {DELIVERY_MODES.map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setDeliveryMode(mode.value)}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${
                            deliveryMode === mode.value
                              ? 'border-cc-orange bg-cc-orange/5 shadow-sm'
                              : 'border-cc-border hover:border-cc-orange/40 bg-cc-surface-container'
                          }`}
                        >
                          <p className={`text-sm font-semibold mb-0.5 ${deliveryMode === mode.value ? 'text-cc-orange' : 'text-cc-text-primary'}`}>
                            {mode.label}
                          </p>
                          <p className="text-xs text-cc-text-secondary leading-tight">{mode.desc}</p>
                        </button>
                      ))}
                    </div>
                  </FormSection>

                  {/* Section: Téléchargement des fichiers */}
                  <FormSection
                    title="Téléchargement des fichiers"
                    badge={`${files.length}/${MAX_FILES} fichiers`}
                  >
                    <div
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                        dragActive
                          ? 'border-cc-orange bg-cc-orange/5 scale-[1.01]'
                          : 'border-cc-border hover:border-cc-orange/50 hover:bg-cc-surface-container-high'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_TYPES}
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cc-orange/20 to-cc-blue/20 flex items-center justify-center">
                          {uploading ? (
                            <Loader2 className="w-6 h-6 text-cc-orange animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6 text-cc-orange" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-cc-text-primary">
                          {uploading ? 'Téléversement en cours…' : 'Glissez-déposez vos fichiers ici'}
                        </p>
                        <p className="text-xs text-cc-text-secondary">
                          ou <span className="text-cc-orange font-medium">cliquez pour parcourir</span>
                        </p>
                        <p className="text-[11px] text-cc-text-secondary/70 mt-1">
                          PDF, Word, Excel, PowerPoint, Images, ZIP/RAR — Max 100 Mo/fichier
                        </p>
                      </div>
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                        {files.map((f, idx) => {
                          return (
                            <div
                              key={`${f.url}-${idx}`}
                              className="flex items-center gap-3 p-2.5 rounded-lg bg-cc-surface-container-high border border-cc-border group"
                            >
                              <div className="flex-1 min-w-0 px-2">
                                <p className="text-sm font-medium text-cc-text-primary truncate">{f.name}</p>
                                <p className="text-xs text-cc-text-secondary">{formatFileSize(f.size)}</p>
                              </div>
                              <button
                                onClick={() => removeFile(idx)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                aria-label="Retirer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </FormSection>

                  {/* Section: Description */}
                  <FormSection title="Décrivez votre besoin">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex : Je souhaite saisir ce document manuscrit de 25 pages et l'imprimer en 3 exemplaires couleur."
                      className="min-h-[100px] resize-y"
                    />
                    <p className="text-xs text-cc-text-secondary mt-1.5">
                      Plus votre description est précise, plus notre devis sera rapide et adapté.
                    </p>
                  </FormSection>

                  {/* Submit */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={step === 'submitting'}
                      className="border-cc-border"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={step === 'submitting'}
                      className="bg-gradient-to-r from-cc-orange to-cc-orange/90 hover:from-cc-orange/90 hover:to-cc-orange text-white shadow-lg shadow-cc-orange/20 min-w-[200px]"
                    >
                      {step === 'submitting' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Envoi en cours…
                        </>
                      ) : (
                        'Envoyer ma demande'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// SUCCESS SCREEN (after submission)
// ==========================================
function SuccessScreen({
  trackingCode,
  clientName,
  onClose,
}: {
  trackingCode: string
  clientName: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode)
    setCopied(true)
    toast.success('Code copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-6 text-center">
      <h3 className="text-2xl font-black text-cc-text-primary mb-2">
        Demande envoyée avec succès !
      </h3>
      <p className="text-sm text-cc-text-secondary mb-6 px-4">
        Merci <span className="font-semibold text-cc-text-primary">{clientName}</span>, votre
        demande a bien été reçue. Notre équipe vous contactera très bientôt avec un devis
        personnalisé.
      </p>

      {/* Tracking code */}
      <div className="inline-flex flex-col items-center gap-2 p-5 rounded-2xl bg-gradient-to-br from-cc-orange/10 to-cc-blue/10 border border-cc-border mb-6">
        <p className="text-xs font-medium text-cc-text-secondary uppercase tracking-wider">
          Votre code de suivi
        </p>
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-black text-cc-orange tracking-wider font-mono">
            {trackingCode}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={copyCode}
          className="mt-2 border-cc-border text-cc-text-primary"
        >
          {copied ? 'Copié !' : 'Copier le code'}
        </Button>
      </div>

      <div className="bg-cc-surface-container-high rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
        <p className="text-sm font-semibold text-cc-text-primary mb-2">
          Prochaines étapes
        </p>
        <ul className="text-xs text-cc-text-secondary space-y-2">
          <li className="flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cc-orange shrink-0 mt-1.5" />
            Votre demande est enregistrée
          </li>
          <li className="flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cc-blue shrink-0 mt-1.5" />
            Vous recevrez un appel / message WhatsApp
          </li>
          <li className="flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cc-orange shrink-0 mt-1.5" />
            Nous vous envoyons un devis avec prix & délai
          </li>
          <li className="flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cc-blue shrink-0 mt-1.5" />
            Livraison numérique ou physique selon votre choix
          </li>
        </ul>
      </div>

      <p className="text-xs text-cc-text-secondary mb-4">
        Conservez votre code de suivi pour suivre l&apos;avancement de votre demande.
      </p>

      <Button
        onClick={onClose}
        className="bg-gradient-to-r from-cc-orange to-cc-orange/90 text-white"
      >
        Terminer
      </Button>
    </div>
  )
}

// ==========================================
// TRACKING DIALOG (suivre ma demande)
// ==========================================
function DocumentTrackingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setCode('')
        setResult(null)
        setSearched(false)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  const handleSearch = async () => {
    if (!code.trim()) {
      toast.error('Veuillez saisir votre code de suivi')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(
        `/api/document-requests?trackingCode=${encodeURIComponent(code.trim().toUpperCase())}`
      )
      if (!res.ok) throw new Error('Erreur serveur')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setResult(data[0])
      } else {
        setResult(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la recherche')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-cc-surface-container rounded-2xl shadow-2xl w-full max-w-lg border border-cc-border overflow-hidden"
          >
            <div className="bg-gradient-to-r from-cc-blue to-cc-blue/90 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">Suivre ma demande</h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <Label htmlFor="track-code" className="mb-1.5 block">Code de suivi</Label>
              <div className="flex gap-2">
                <Input
                  id="track-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex : DOC-AB12CD"
                  className="font-mono uppercase"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-gradient-to-r from-cc-blue to-cc-blue/90 text-white shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span className={loading ? 'ml-1.5' : ''}>Rechercher</span>
                </Button>
              </div>

              {/* Results */}
              {searched && !loading && (
                <div className="mt-5">
                  {result ? (
                    <TrackingResultCard data={result} />
                  ) : (
                    <div className="text-center py-8 text-cc-text-secondary">
                      <p className="text-sm">Aucune demande trouvée avec ce code.</p>
                      <p className="text-xs mt-1">Vérifiez votre code de suivi et réessayez.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// TRACKING RESULT CARD
// ==========================================
function TrackingResultCard({ data }: { data: any }) {
  const steps = [
    { key: 'RECEIVED', label: 'Demande reçue' },
    { key: 'IN_PROGRESS', label: 'En cours de traitement' },
    { key: 'AWAITING_PAYMENT', label: 'En attente de paiement' },
    { key: 'COMPLETED', label: 'Terminé' },
    { key: 'DELIVERED', label: 'Livré' },
  ]
  const order = ['RECEIVED', 'IN_PROGRESS', 'AWAITING_PAYMENT', 'COMPLETED', 'DELIVERED']
  const currentIdx = order.indexOf(data.status)
  const isCancelled = data.status === 'CANCELLED'

  return (
    <div className="bg-cc-surface-container-high rounded-xl border border-cc-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-cc-text-secondary">Code de suivi</p>
          <p className="text-lg font-black text-cc-orange font-mono">{data.trackingCode}</p>
        </div>
        <Badge className={
          isCancelled
            ? 'bg-red-500/10 text-red-500 border-red-500/20'
            : 'bg-cc-blue/10 text-cc-blue border-cc-blue/20'
        }>
          {data.statusLabel || data.status}
        </Badge>
      </div>

      <div className="space-y-1 text-sm mb-4">
        <p><span className="text-cc-text-secondary">Service :</span> <span className="font-medium text-cc-text-primary">{data.serviceTypeLabel || data.serviceType}</span></p>
        <p><span className="text-cc-text-secondary">Livraison :</span> <span className="font-medium text-cc-text-primary">{data.deliveryModeLabel || data.deliveryMode}</span></p>
        <p><span className="text-cc-text-secondary">Date :</span> <span className="font-medium text-cc-text-primary">{new Date(data.createdAt).toLocaleDateString('fr-FR')}</span></p>
      </div>

      {data.quoteAmount != null && data.quoteAmount > 0 && (
        <div className="bg-cc-orange/10 border border-cc-orange/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-cc-text-secondary">Devis proposé</p>
          <p className="text-xl font-black text-cc-orange">{data.quoteAmount.toLocaleString('fr-FR')} FCFA</p>
          {data.quoteDelay && <p className="text-xs text-cc-text-secondary mt-1">Délai : {data.quoteDelay}</p>}
          {data.quoteNote && <p className="text-xs text-cc-text-primary mt-1 italic">{data.quoteNote}</p>}
        </div>
      )}

      {data.finalDocumentUrl && (
        <a
          href={data.finalDocumentUrl}
          download
          className="flex items-center justify-center gap-2 w-full p-3 mb-4 rounded-lg bg-cc-blue/10 text-cc-blue hover:bg-cc-blue/15 transition-colors text-sm font-semibold"
        >
          Télécharger votre document final
        </a>
      )}

      {/* Progress steps */}
      {!isCancelled && (
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-cc-border" />
          <div
            className="absolute left-4 top-4 w-0.5 bg-gradient-to-b from-cc-orange to-cc-blue transition-all duration-500"
            style={{ height: `calc(${(currentIdx / (order.length - 1)) * 100}% - 0px)` }}
          />
          <div className="space-y-4">
            {steps.map((s, i) => {
              const done = i <= currentIdx
              return (
                <div key={s.key} className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    done
                      ? 'bg-gradient-to-br from-cc-orange to-cc-blue text-white'
                      : 'bg-cc-surface-container border border-cc-border text-cc-text-secondary'
                  }`}>
                    {done ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-cc-text-secondary/30" />
                    )}
                  </div>
                  <span className={`text-sm ${done ? 'font-semibold text-cc-text-primary' : 'text-cc-text-secondary'}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// FORM SECTION WRAPPER
// ==========================================
function FormSection({
  title,
  children,
  badge,
}: {
  title: string
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-cc-text-primary flex items-center gap-2">
          {title}
        </h3>
        {badge && (
          <Badge variant="outline" className="text-xs border-cc-border text-cc-text-secondary">
            {badge}
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}
