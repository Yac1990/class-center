'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { WHATSAPP_NUMBER } from '@/lib/constants'

// ==========================================
// SUB-SECTION COMPONENT
// ==========================================
function PolicySubSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold text-cc-text-primary">{title}</h4>
      </div>
      <div className="text-sm text-cc-text-secondary leading-relaxed space-y-1.5">
        {children}
      </div>
    </div>
  )
}

function PolicyBullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-cc-text-secondary/40 mt-2 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

// ==========================================
// NEWSLETTER COMPONENT
// ==========================================
function NewsletterCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/promotional-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'NEWSLETTER' }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error?.includes('déjà') || data.error?.includes('already')) {
          setStatus('success') // treat duplicate as success
          setEmail('')
        } else {
          setStatus('error')
        }
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mt-10">
      <div className="bg-cc-surface-container border border-cc-border rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="font-bold text-cc-text-primary text-base">Restez informé</h3>
            <p className="text-sm text-cc-text-secondary mt-0.5">
              Recevez nos offres exclusives et promotions en avant-première
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status === 'error') setStatus('idle')
            }}
            required
            className="flex-1 h-11 bg-cc-surface-container-high border-cc-border text-cc-text-primary placeholder:text-cc-text-secondary/50 rounded-lg focus-visible:ring-cc-orange/30 focus-visible:border-cc-orange/50"
          />
          <Button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="h-11 px-5 bg-cc-orange hover:bg-cc-orange/90 text-white font-semibold rounded-lg btn-glow-orange shrink-0"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">Envoi...</span>
              </span>
            ) : status === 'success' ? (
              <span className="flex items-center gap-1.5">
                <span className="hidden sm:inline">Inscrit !</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="hidden sm:inline">S&apos;inscrire</span>
              </span>
            )}
          </Button>
        </form>

        {status === 'error' && (
          <p className="text-xs text-red-500 mt-2">Une erreur est survenue. Veuillez réessayer.</p>
        )}
        {status === 'success' && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Merci pour votre inscription ! Vous recevrez bientôt nos offres.
          </p>
        )}

        <p className="text-xs text-cc-text-secondary/50 mt-3">
          En vous inscrivant, vous acceptez notre politique de confidentialité. Pas de spam, désabonnement facile.
        </p>
      </div>
    </div>
  )
}

// ==========================================
// ANIMATION VARIANTS
// ==========================================
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: 'easeOut' as const },
  }),
}

// ==========================================
// MAIN POLICIES SECTION COMPONENT
// ==========================================
export function PoliciesSection() {
  return (
    <section className="py-16 sm:py-20 bg-cc-surface-dim">
      <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cc-surface-container border border-cc-border rounded-full mb-4">
            <span className="text-[11px] uppercase tracking-widest text-cc-text-secondary font-medium">Transparence & Confiance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-3">
            Politiques & <span className="gradient-text">Mentions légales</span>
          </h2>
          <p className="text-cc-text-secondary max-w-lg mx-auto text-sm">
            Nous nous engageons à protéger vos données et à assurer une expérience transparente. Consultez nos politiques ci-dessous.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {/* 1. Politique de confidentialité */}
            <motion.div custom={0} variants={itemVariants}>
              <AccordionItem
                value="privacy"
                id="politique-confidentialite"
                className="bg-cc-surface-container border border-cc-border rounded-2xl px-5 sm:px-6 overflow-hidden data-[state=open]:border-cc-orange/30 transition-colors"
              >
                <AccordionTrigger className="py-5 hover:no-underline group">
                  <div className="flex items-center gap-3 text-left">
                    <div>
                      <span className="font-bold text-cc-text-primary text-sm sm:text-base">Politique de confidentialité</span>
                      <span className="block text-xs text-cc-text-secondary">Protection et gestion de vos données personnelles</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <Separator className="mb-5 bg-cc-border" />

                  <PolicySubSection title="Collecte de données">
                    <PolicyBullet>Nom complet et numéro de téléphone pour le traitement des commandes</PolicyBullet>
                    <PolicyBullet>Informations de paiement (Wave, Djamo) nécessaires aux transactions</PolicyBullet>
                    <PolicyBullet>Adresse de livraison pour les produits physiques (Vente Flash)</PolicyBullet>
                    <PolicyBullet>Adresse e-mail pour la newsletter et les communications (optionnel)</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Utilisation des données">
                    <PolicyBullet>Traitement et suivi de vos commandes (recharges, souscriptions, cartes)</PolicyBullet>
                    <PolicyBullet>Amélioration continue de nos services et de votre expérience utilisateur</PolicyBullet>
                    <PolicyBullet>Envoi de notifications liées à vos commandes en cours</PolicyBullet>
                    <PolicyBullet>Communications promotionnelles avec votre consentement préalable</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Protection des données">
                    <PolicyBullet>Transactions sécurisées via les plateformes officielles Wave et Djamo</PolicyBullet>
                    <PolicyBullet>Aucune donnée bancaire n&apos;est stockée sur nos serveurs</PolicyBullet>
                    <PolicyBullet>Accès restreint aux données personnelles, uniquement par le personnel autorisé</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Partage des données">
                    <PolicyBullet>Aucun partage de vos données personnelles à des tiers sans votre consentement explicite</PolicyBullet>
                    <PolicyBullet>Les données de paiement sont traitées directement par les plateformes de paiement sécurisées</PolicyBullet>
                    <PolicyBullet>Données partagées uniquement si requis par la loi en vigueur</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Cookies et technologies similaires">
                    <PolicyBullet>Utilisation de cookies essentiels au bon fonctionnement du site</PolicyBullet>
                    <PolicyBullet>Cookies d&apos;analyse pour comprendre l&apos;utilisation du site et améliorer nos services</PolicyBullet>
                    <PolicyBullet>Vous pouvez désactiver les cookies dans les paramètres de votre navigateur</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Droits des utilisateurs">
                    <PolicyBullet><strong>Droit d&apos;accès</strong> — Consultez les données personnelles que nous détenons</PolicyBullet>
                    <PolicyBullet><strong>Droit de modification</strong> — Corrigez vos informations à tout moment</PolicyBullet>
                    <PolicyBullet><strong>Droit de suppression</strong> — Demandez la suppression de vos données personnelles</PolicyBullet>
                    <PolicyBullet><strong>Droit d&apos;opposition</strong> — Refusez le traitement de vos données à des fins marketing</PolicyBullet>
                  </PolicySubSection>

                  <div className="mt-5 p-3 bg-cc-surface-container-high rounded-xl border border-cc-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cc-text-secondary">
                        Contact : <a href="mailto:classcenter.ci@gmail.com" className="text-cc-orange hover:underline font-medium">classcenter.ci@gmail.com</a>
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>

            {/* 2. Politique de non-retour */}
            <motion.div custom={1} variants={itemVariants}>
              <AccordionItem
                value="returns"
                id="politique-non-retour"
                className="bg-cc-surface-container border border-cc-border rounded-2xl px-5 sm:px-6 overflow-hidden data-[state=open]:border-red-500/30 transition-colors"
              >
                <AccordionTrigger className="py-5 hover:no-underline group">
                  <div className="flex items-center gap-3 text-left">
                    <div>
                      <span className="font-bold text-cc-text-primary text-sm sm:text-base">Politique de non-retour</span>
                      <span className="block text-xs text-cc-text-secondary">Conditions de retour et d&apos;échange</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <Separator className="mb-5 bg-cc-border" />

                  <PolicySubSection title="Produits numériques (recharges & souscriptions)">
                    <PolicyBullet>Les recharges et souscriptions sont livrées instantanément par code ou crédit direct</PolicyBullet>
                    <PolicyBullet><strong className="text-cc-text-primary">Aucun retour possible</strong> une fois le produit livré et le code communiqué</PolicyBullet>
                    <PolicyBullet>La livraison est considérée comme effective dès l&apos;envoi du code par WhatsApp ou SMS</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Vente Flash — Produits physiques">
                    <PolicyBullet>Paiement à la livraison uniquement (aucun paiement anticipé requis)</PolicyBullet>
                    <PolicyBullet><strong className="text-cc-text-primary">Aucun retour possible</strong> après confirmation de la livraison par le client</PolicyBullet>
                    <PolicyBullet>Vérifiez soigneusement votre commande lors de la réception avant de confirmer</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Produits défectueux">
                    <PolicyBullet>Remplacement possible dans les <strong className="text-cc-text-primary">48 heures</strong> suivant la livraison</PolicyBullet>
                    <PolicyBullet>Preuve obligatoire : photo ou vidéo du défaut envoyée via WhatsApp</PolicyBullet>
                    <PolicyBullet>Le remplacement est effectué après validation par notre équipe</PolicyBullet>
                    <PolicyBullet>Aucun remboursement, uniquement un échange contre un produit identique</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Annulation de commande">
                    <PolicyBullet>L&apos;annulation est possible <strong className="text-cc-text-primary">uniquement avant l&apos;expédition</strong> du produit</PolicyBullet>
                    <PolicyBullet>Pour les produits numériques : annulation impossible une fois le code généré</PolicyBullet>
                    <PolicyBullet>Contactez-nous rapidement via WhatsApp pour toute demande d&apos;annulation</PolicyBullet>
                  </PolicySubSection>

                  <div className="mt-5 p-3 bg-red-500/5 dark:bg-red-500/10 rounded-xl border border-red-500/20">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-cc-text-secondary">
                        Important : La politique de non-retour s&apos;applique à tous les produits numériques et physiques vendus sur CLASS CENTER, conformément aux lois de consommation applicables en Côte d&apos;Ivoire.
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>

            {/* 3. Conditions générales de vente */}
            <motion.div custom={2} variants={itemVariants}>
              <AccordionItem
                value="terms"
                id="conditions-vente"
                className="bg-cc-surface-container border border-cc-border rounded-2xl px-5 sm:px-6 overflow-hidden data-[state=open]:border-cc-blue/30 transition-colors"
              >
                <AccordionTrigger className="py-5 hover:no-underline group">
                  <div className="flex items-center gap-3 text-left">
                    <div>
                      <span className="font-bold text-cc-text-primary text-sm sm:text-base">Conditions générales de vente</span>
                      <span className="block text-xs text-cc-text-secondary">Règles et modalités d&apos;achat</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <Separator className="mb-5 bg-cc-border" />

                  <PolicySubSection title="Acceptation des conditions">
                    <PolicyBullet>Toute commande passée sur CLASS CENTER implique l&apos;acceptation pleine et entière des présentes conditions</PolicyBullet>
                    <PolicyBullet>Ces conditions prévalent sur tout autre document ou accord antérieur</PolicyBullet>
                    <PolicyBullet>CLASS CENTER se réserve le droit de modifier les CGV à tout moment</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Prix et paiement">
                    <PolicyBullet>Tous les prix sont indiqués en FCFA (Franc CFA)</PolicyBullet>
                    <PolicyBullet>Moyens de paiement acceptés : <strong className="text-cc-text-primary">Wave</strong> (via ordinateur) et <strong className="text-cc-text-primary">Djamo</strong> (via smartphone)</PolicyBullet>
                    <PolicyBullet>Le paiement est requis avant la livraison des produits numériques (recharges, souscriptions)</PolicyBullet>
                    <PolicyBullet>Pour les produits physiques (Vente Flash) : paiement à la livraison uniquement</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Livraison">
                    <PolicyBullet><strong className="text-cc-text-primary">Produits numériques</strong> : livraison instantanée par WhatsApp ou SMS</PolicyBullet>
                    <PolicyBullet><strong className="text-cc-text-primary">Produits physiques</strong> : livraison à domicile avec paiement à la livraison</PolicyBullet>
                    <PolicyBullet>Délai de livraison indicatif : 24h à 72h selon la zone géographique (Abidjan et environs)</PolicyBullet>
                    <PolicyBullet>Le client doit vérifier le produit lors de la livraison avant confirmation</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Responsabilité">
                    <PolicyBullet>CLASS CENTER s&apos;engage à fournir les produits et services commandés dans les meilleurs délais</PolicyBullet>
                    <PolicyBullet>En cas d&apos;indisponibilité, le client sera informé et pourra choisir entre un remboursement ou un produit équivalent</PolicyBullet>
                    <PolicyBullet>CLASS CENTER ne saurait être tenu responsable des retards dus à des cas de force majeure</PolicyBullet>
                    <PolicyBullet>La responsabilité de CLASS CENTER est limitée au montant de la commande</PolicyBullet>
                  </PolicySubSection>

                  <PolicySubSection title="Droit applicable">
                    <PolicyBullet>Les présentes conditions sont régies par le droit <strong className="text-cc-text-primary">ivoirien</strong></PolicyBullet>
                    <PolicyBullet>Tout litige sera soumis aux tribunaux compétents d&apos;Abidjan, Côte d&apos;Ivoire</PolicyBullet>
                    <PolicyBullet>La langue de référence pour le règlement des litiges est le français</PolicyBullet>
                  </PolicySubSection>
                </AccordionContent>
              </AccordionItem>
            </motion.div>

            {/* 4. Mentions légales */}
            <motion.div custom={3} variants={itemVariants}>
              <AccordionItem
                value="legal"
                id="mentions-legales"
                className="bg-cc-surface-container border border-cc-border rounded-2xl px-5 sm:px-6 overflow-hidden data-[state=open]:border-cc-yellow/30 transition-colors"
              >
                <AccordionTrigger className="py-5 hover:no-underline group">
                  <div className="flex items-center gap-3 text-left">
                    <div>
                      <span className="font-bold text-cc-text-primary text-sm sm:text-base">Mentions légales</span>
                      <span className="block text-xs text-cc-text-secondary">Informations légales sur l&apos;éditeur du site</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <Separator className="mb-5 bg-cc-border" />

                  <PolicySubSection title="Éditeur du site">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-cc-text-secondary">Dénomination :</span>
                        <strong className="text-cc-text-primary">CLASS CENTER</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cc-text-secondary">Statut :</span>
                        <span className="text-cc-text-primary">Entreprise individuelle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cc-text-secondary">Siège social :</span>
                        <span className="text-cc-text-primary">Abidjan, Côte d&apos;Ivoire</span>
                      </div>
                    </div>
                  </PolicySubSection>

                  <PolicySubSection title="Contact">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-cc-text-secondary">WhatsApp :</span>
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cc-orange hover:underline font-medium"
                        >
                          {WHATSAPP_NUMBER}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cc-text-secondary">E-mail :</span>
                        <a href="mailto:classcenter.ci@gmail.com" className="text-cc-orange hover:underline font-medium">
                          classcenter.ci@gmail.com
                        </a>
                      </div>
                    </div>
                  </PolicySubSection>

                  <PolicySubSection title="Hébergement">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-cc-text-secondary">Plateforme :</span>
                        <span className="text-cc-text-primary">Vercel Inc.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cc-text-secondary">Adresse :</span>
                        <span className="text-cc-text-primary">440 N Barranca Ave, Covina, CA 91723, USA</span>
                      </div>
                    </div>
                  </PolicySubSection>

                  <div className="mt-5 p-3 bg-cc-surface-container-high rounded-xl border border-cc-border">
                    <p className="text-xs text-cc-text-secondary">
                      Le site CLASS CENTER est la propriété exclusive de CLASS CENTER. Toute reproduction, même partielle, du contenu de ce site est interdite sans autorisation préalable écrite.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          </Accordion>
        </motion.div>

        {/* Newsletter */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
        >
          <NewsletterCapture />
        </motion.div>
      </div>
    </section>
  )
}
