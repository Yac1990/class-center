'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Search, ChevronDown, Send, Phone, Mail,
  ShoppingBag, Smartphone, FileText, CreditCard, Truck, RefreshCw,
  ShieldCheck, Clock, HelpCircle, Sparkles, Zap, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from '@/lib/constants'

// ==========================================
// TYPES & DATA
// ==========================================

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

interface HelpCategory {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  message: string
}

const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'recharge',
    title: 'Recharge mobile',
    description: 'Orange, MTN, Moov — code de recharge non reçu, délai, erreur de numéro',
    icon: Smartphone,
    color: 'from-orange-500 to-amber-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai besoin d'aide pour une recharge mobile.\n\nDétails :\n- Opérateur : \n- Numéro rechargé : \n- Montant : \n- Problème rencontré : ",
  },
  {
    id: 'souscription',
    title: 'Souscription forfait',
    description: 'Forfait Orange/MTN/Moov, activation, modification ou désactivation',
    icon: Zap,
    color: 'from-blue-500 to-indigo-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai besoin d'aide pour une souscription de forfait.\n\nDétails :\n- Opérateur : \n- Forfait souhaité : \n- Numéro à souscrire : \n- Question : ",
  },
  {
    id: 'vente-flash',
    title: 'Vente Flash / Produits',
    description: 'Commande, livraison, produit défectueux, remboursement, suivi de commande',
    icon: ShoppingBag,
    color: 'from-pink-500 to-rose-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai une question concernant ma commande Vente Flash.\n\nDétails :\n- Numéro de commande : \n- Produit concerné : \n- Problème rencontré : ",
  },
  {
    id: 'documents',
    title: 'Documents à traiter',
    description: 'Saisie, mise en page, impression, devis, suivi de demande de document',
    icon: FileText,
    color: 'from-emerald-500 to-teal-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai une question concernant ma demande de document.\n\nDétails :\n- Code de suivi (DOC-XXXXXX) : \n- Type de service : \n- Question : ",
  },
  {
    id: 'paiement',
    title: 'Paiement & Facturation',
    description: 'Wave, Djamo, échec de paiement, reçu, code de transaction, remboursement',
    icon: CreditCard,
    color: 'from-violet-500 to-purple-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai un problème de paiement.\n\nDétails :\n- Méthode (Wave / Djamo) : \n- Montant : \n- Date : \n- Problème rencontré : ",
  },
  {
    id: 'livraison',
    title: 'Livraison & Retrait',
    description: 'Délai, commune, adresse, frais de livraison, retrait en locaux',
    icon: Truck,
    color: 'from-cyan-500 to-sky-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai une question sur la livraison.\n\nDétails :\n- Numéro de commande : \n- Commune / Adresse : \n- Question : ",
  },
  {
    id: 'fidelite',
    title: 'Programme Fidélité',
    description: 'Statut, badges, code promo, cashback, paliers Bronze/Silver/Gold/Platinum',
    icon: Sparkles,
    color: 'from-amber-500 to-yellow-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai une question sur le programme fidélité.\n\nDétails :\n- Mon compte (email/tél) : \n- Question : ",
  },
  {
    id: 'autre',
    title: 'Autre demande',
    description: 'Une question qui ne rentre dans aucune catégorie ci-dessus',
    icon: HelpCircle,
    color: 'from-slate-500 to-gray-500',
    message: "Bonjour CLASS CENTER 👋\n\nJ'ai une question générale.\n\nDétails de ma demande : ",
  },
]

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Recharge',
    question: "Je n'ai pas reçu mon code de recharge, que faire ?",
    answer: "Pas de panique ! Après votre paiement via Wave ou Djamo, le code est envoyé par WhatsApp dans les 5 à 30 minutes. Vérifiez vos messages (y compris les dossiers spam/autres). Si après 30 minutes vous n'avez rien reçu, contactez-nous via WhatsApp avec votre numéro de transaction.",
  },
  {
    id: 'faq-2',
    category: 'Recharge',
    question: "Le code de recharge ne fonctionne pas, que faire ?",
    answer: "Si le code ne passe pas sur votre téléphone, ne le supprimez pas. Contactez-nous immédiatement via WhatsApp en indiquant : le code reçu, votre numéro, l'opérateur et le message d'erreur affiché. Nous vérifierons et remplacerons le code si nécessaire.",
  },
  {
    id: 'faq-3',
    category: 'Paiement',
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Nous acceptons Wave et Djamo pour les recharges, forfaits et cartes. Pour la Vente Flash, vous pouvez aussi payer à la livraison dans certaines communes d'Abidjan. Le paiement se fait en toute sécurité via nos liens officiels.",
  },
  {
    id: 'faq-4',
    category: 'Paiement',
    question: "Mon paiement a échoué mais j'ai été débité, que faire ?",
    answer: "Si vous avez été débité sans recevoir de confirmation, ne re-tentez pas le paiement. Envoyez-nous immédiatement sur WhatsApp : la capture d'écran de la déduction, le montant, la date et l'heure. Nous vérifierons la transaction et vous rembourserons ou activerons le service selon le cas.",
  },
  {
    id: 'faq-5',
    category: 'Vente Flash',
    question: "Combien de temps pour la livraison de ma commande ?",
    answer: "À Abidjan, la livraison intervient généralement sous 24h à 72h selon la commune. En zone périphérique, comptez 2 à 5 jours. Vous recevrez un message WhatsApp avec le nom et le numéro du livreur avant l'arrivée.",
  },
  {
    id: 'faq-6',
    category: 'Vente Flash',
    question: "Puis-je retourner un produit défectueux ?",
    answer: "Oui. Vous disposez de 48h après réception pour signaler un défaut via WhatsApp avec photos. Nous organisons l'échange ou le remboursement. Le produit doit être dans son état d'origine avec emballage.",
  },
  {
    id: 'faq-7',
    category: 'Documents',
    question: "Combien de temps pour traiter mon document ?",
    answer: "Le délai dépend du type de service : saisie simple (24-48h), mise en page (24-72h), mémoire/thèse (3-7 jours). Un devis avec délai précis vous est envoyé après réception de votre demande. Le délai court à partir de la validation du devis.",
  },
  {
    id: 'faq-8',
    category: 'Documents',
    question: "Comment suivre l'avancement de ma demande de document ?",
    answer: "Après envoi, vous recevez un code de suivi unique (format DOC-XXXXXX). Utilisez le bouton « Suivre ma demande » sur le site, entrez ce code, et vous verrez en temps réel : Reçu → En cours → En attente de paiement → Terminé → Livré.",
  },
  {
    id: 'faq-9',
    category: 'Fidélité',
    question: "Comment fonctionne le programme fidélité ?",
    answer: "Chaque opération ≥ 5000 FCFA (recharge, forfait, achat Vente Flash, cartes) compte comme 1 action qualifiée. À 5 actions → Bronze, 25 → Silver (+5000F de promo), 50 → Gold (+10000F), 100 → Platinum (+25000F). Les codes promo sont disponibles dans votre Espace Client.",
  },
  {
    id: 'faq-10',
    category: 'Général',
    question: "Quels sont vos horaires de service ?",
    answer: "Notre service client WhatsApp est disponible tous les jours de 7h à 22h. Les commandes passées hors horaires sont traitées dès l'ouverture. Les demandes de documents sont traitées du lundi au samedi, 8h-19h.",
  },
  {
    id: 'faq-11',
    category: 'Général',
    question: "Comment puis-je vous faire confiance ?",
    answer: "CLASS CENTER est un centre de services installé à Abidjan. Nous traitons des centaines de commandes par mois avec un service client réactif sur WhatsApp. Paiements sécurisés via Wave et Djamo, suivi de commande transparent, et remboursement en cas de problème.",
  },
  {
    id: 'faq-12',
    category: 'Général',
    question: "Livrez-vous en dehors d'Abidjan ?",
    answer: "Pour les produits Vente Flash : oui, dans toute la Côte d'Ivoire via nos transporteurs partenaires (frais et délais selon la localité). Pour les recharges/forfaits : tout se fait à distance via WhatsApp, partout dans le pays.",
  },
]

// ==========================================
// HELPERS
// ==========================================

function buildWhatsappUrl(message: string): string {
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}`
}

// ==========================================
// MAIN SECTION (landing)
// ==========================================

export function WhatsAppHelpCenterSection() {
  const [overlayOpen, setOverlayOpen] = useState(false)

  return (
    <section id="section-help-center" className="py-16 sm:py-20 bg-cc-page-bg relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cc-orange/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="inline-flex items-center gap-1.5 mb-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15">
            <MessageCircle className="w-3.5 h-3.5" />
            Centre d'aide WhatsApp
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-cc-text-primary mb-3 leading-tight">
            Besoin d&apos;aide ? <span className="gradient-text">On est là pour vous.</span>
          </h2>
          <p className="text-sm sm:text-base text-cc-text-secondary max-w-2xl mx-auto leading-relaxed">
            Contactez notre équipe support par WhatsApp pour une réponse rapide, ou consultez
            nos réponses aux questions les plus fréquentes.
          </p>

          {/* WhatsApp highlight bar */}
          <motion.div
            className="mt-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 p-[2px] shadow-xl shadow-emerald-500/20">
              <div className="rounded-2xl bg-cc-surface-container p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0 shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                    Support direct
                  </p>
                  <p className="text-base sm:text-lg font-bold text-cc-text-primary truncate">
                    {WHATSAPP_NUMBER}
                  </p>
                  <p className="text-xs text-cc-text-secondary mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                    <Clock className="w-3 h-3" /> Tous les jours, 7h - 22h
                  </p>
                </div>
                <a
                  href={buildWhatsappUrl("Bonjour CLASS CENTER 👋\n\nJ'ai besoin d'aide.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Discuter maintenant
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Help category cards */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-cc-text-primary mb-4 text-center sm:text-left">
            Choisissez votre sujet
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {HELP_CATEGORIES.map((cat, idx) => (
              <motion.button
                key={cat.id}
                onClick={() => setOverlayOpen(true)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="group text-left p-4 rounded-2xl bg-cc-surface-container border border-cc-border hover:border-emerald-500/40 transition-all hover:shadow-lg"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-md`}>
                  <cat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-cc-text-primary mb-1 leading-tight">{cat.title}</p>
                <p className="text-[11px] sm:text-xs text-cc-text-secondary leading-snug line-clamp-3">{cat.description}</p>
                <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Contacter <ArrowRight className="w-3 h-3" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* FAQ preview */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-cc-text-primary">Questions fréquentes</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOverlayOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10"
            >
              Tout voir <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {FAQ_ITEMS.slice(0, 4).map((item) => (
              <FAQAccordionItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* CTA strip */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="lg"
            onClick={() => setOverlayOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 px-6"
          >
            <HelpCircle className="w-5 h-5 mr-2" />
            Ouvrir le Centre d&apos;aide
          </Button>
        </motion.div>
      </div>

      <WhatsAppHelpCenterOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
      />
    </section>
  )
}

// ==========================================
// FAQ ACCORDION ITEM
// ==========================================

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-cc-surface-container border border-cc-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-cc-surface-container-high transition-colors"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-cc-border text-cc-text-secondary shrink-0">
            {item.category}
          </Badge>
          <span className="text-sm font-medium text-cc-text-primary truncate">{item.question}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-cc-text-secondary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 pt-0 text-sm text-cc-text-secondary leading-relaxed">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==========================================
// OVERLAY (full help center)
// ==========================================

interface OverlayProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function WhatsAppHelpCenterOverlay({ open, onOpenChange }: OverlayProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [customMessage, setCustomMessage] = useState('')

  // Lock body scroll
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSearch('')
        setActiveCategory('all')
        setCustomMessage('')
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  const filteredFaqs = FAQ_ITEMS.filter(item => {
    const matchSearch = !search ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase()
    return matchSearch && matchCat
  })

  const allCategories = ['all', ...Array.from(new Set(FAQ_ITEMS.map(i => i.category)))]

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
            className="bg-cc-surface-container rounded-2xl shadow-2xl w-full max-w-4xl my-4 sm:my-8 border border-cc-border"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 sm:px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">Centre d&apos;aide WhatsApp</h2>
                  <p className="text-xs sm:text-sm text-white/80 truncate">
                    Réponses rapides & contact direct
                  </p>
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
              {/* Quick contact banner */}
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <p className="text-sm font-bold text-cc-text-primary">Support WhatsApp</p>
                  <p className="text-xs text-cc-text-secondary">{WHATSAPP_NUMBER} • 7h - 22h</p>
                </div>
                <a
                  href={buildWhatsappUrl("Bonjour CLASS CENTER 👋\n\nJ'ai besoin d'aide.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Discuter
                </a>
              </div>

              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cc-text-secondary" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une question..."
                  className="pl-10"
                />
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-2 mb-5">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      activeCategory === cat
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-cc-surface-container-high text-cc-text-secondary border-cc-border hover:border-emerald-500/40'
                    }`}
                  >
                    {cat === 'all' ? 'Toutes' : cat}
                  </button>
                ))}
              </div>

              {/* FAQ list */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-cc-text-primary mb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  Questions fréquentes
                </h3>
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-cc-text-secondary">
                    Aucune question ne correspond à votre recherche.
                    <br />
                    Contactez-nous directement via WhatsApp ci-dessous 👇
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFaqs.map(item => (
                      <FAQAccordionItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>

              {/* Custom message + send to WhatsApp */}
              <div className="rounded-xl border border-cc-border bg-cc-surface-container-high p-4">
                <h3 className="text-sm font-bold text-cc-text-primary mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-500" />
                  Décrivez votre problème
                </h3>
                <p className="text-xs text-cc-text-secondary mb-3">
                  Tapez votre message, nous vous répondons sur WhatsApp avec votre texte pré-rempli.
                </p>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Ex : Bonjour, je n'ai pas reçu ma recharge Orange de 2000F faite ce matin..."
                  className="w-full min-h-[100px] rounded-lg border border-cc-border bg-cc-surface-container p-3 text-sm text-cc-text-primary placeholder:text-cc-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
                />
                <a
                  href={buildWhatsappUrl(
                    customMessage.trim()
                      ? `Bonjour CLASS CENTER 👋\n\n${customMessage.trim()}`
                      : "Bonjour CLASS CENTER 👋\n\nJ'ai besoin d'aide."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-sm shadow-lg transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Envoyer sur WhatsApp
                </a>
              </div>

              {/* Category quick-links */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-cc-text-primary mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Contact rapide par sujet
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HELP_CATEGORIES.map(cat => (
                    <a
                      key={cat.id}
                      href={buildWhatsappUrl(cat.message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-cc-border bg-cc-surface-container hover:border-emerald-500/40 hover:bg-cc-surface-container-high transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0`}>
                        <cat.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-cc-text-primary truncate">{cat.title}</p>
                        <p className="text-[11px] text-cc-text-secondary truncate">Contacter via WhatsApp</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-cc-text-secondary group-hover:text-emerald-500 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Trust signals */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Clock, label: 'Réponse < 15 min' },
                  { icon: ShieldCheck, label: 'Paiement sécurisé' },
                  { icon: RefreshCw, label: 'Remboursement' },
                  { icon: Mail, label: 'supportclasscenter@gmail.com' },
                ].map((t, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-cc-surface-container-high border border-cc-border">
                    <t.icon className="w-4 h-4 text-emerald-500" />
                    <p className="text-[11px] font-medium text-cc-text-primary leading-tight">{t.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ==========================================
// FLOATING WHATSAPP HELP BUTTON
// ==========================================

export function FloatingWhatsAppButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-emerald-500/30 flex items-center justify-center group"
        aria-label="Centre d'aide WhatsApp"
      >
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
        <MessageCircle className="w-7 h-7 text-white relative" />
        {/* Tooltip */}
        <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-cc-surface-container border border-cc-border text-xs font-medium text-cc-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Besoin d&apos;aide ?
        </span>
      </motion.button>

      <WhatsAppHelpCenterOverlay open={open} onOpenChange={setOpen} />
    </>
  )
}
