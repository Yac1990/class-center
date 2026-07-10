'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OPERATOR_INFO, HERO_PHRASES } from '@/lib/constants'
import { PhysicalCardsSection } from '@/components/physical-cards-section'
import { PhysicalCatalogOverlay } from '@/components/physical-catalog-overlay'
import { FlashSaleSection } from '@/components/flash-sale-section'
import { FlashSlideshow } from '@/components/flash-slideshow'
import { FlashProductDetail } from '@/components/flash-product-detail'
import { FlashCatalogOverlay } from '@/components/flash-catalog-overlay'

import { AboutUsSection } from '@/components/about-us-section'
import { DocumentsSection } from '@/components/documents-section'

// ==========================================
// ANIMATED COUNTER
// ==========================================
export function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return <span>{count.toLocaleString('fr-FR')}</span>
}

// ==========================================
// LANDING PAGE - Theme-aware
// ==========================================
export function LandingPage({ heroIndex, onGoToClient }: { heroIndex: number; onGoToClient: () => void }) {
  const [stats, setStats] = useState<{ totalRecharges: number; totalClients: number } | null>(null)
  const [publications, setPublications] = useState<any[]>([])
  const [selectedFlashProduct, setSelectedFlashProduct] = useState<any>(null)
  const [showFlashCatalog, setShowFlashCatalog] = useState(false)
  const [showPhysicalCatalog, setShowPhysicalCatalog] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats({ totalRecharges: data.totalRecharges || 0, totalClients: data.totalClients || 0 }))
      .catch(() => {})
    fetch('/api/publications')
      .then(r => r.json())
      .then(data => setPublications(data))
      .catch(() => {})
  }, [])

  // Default promo cards when no publications
  const promoCards = publications.length > 0 ? publications : [
    { id: 'default-1', title: 'Bonus Orange', content: 'Rechargez et profitez de bonus x2', operator: 'ORANGE', type: 'PROMO' },
    { id: 'default-2', title: 'Forfait MTN', content: 'Data illimitée ce weekend', operator: 'MTN', type: 'PROMO' },
    { id: 'default-3', title: 'Pass Moov', content: 'Appels gratuits vers Moov', operator: 'MOOV', type: 'BONUS' },
  ]

  // Service category labels
  const serviceCategoryLabels: Record<string, { label: string }> = {
    FLYERS: { label: 'Flyers' },
    CARTES_INVITATION: { label: 'Cartes d\'invitation' },
    IMPRESSION: { label: 'Impression' },
    PHOTO: { label: 'Photo minute' },
    PLASTIFICATION: { label: 'Plastification' },
    SCAN: { label: 'Scan & Numérisation' },
    RELIURE: { label: 'Reliure' },
    AUTRE: { label: 'Autre service' },
  }

  return (
    <div className="pt-14">
      {/* Hero Section */}
      <section className="relative overflow-hidden dark:bg-black bg-cc-page-bg min-h-[90vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-20 dark:opacity-10"
          />
        </div>
        {/* Noise + Kinetic gradient overlays */}
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 kinetic-gradient" />

        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 bg-cc-orange/8 rounded-full blur-[100px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-cc-blue/8 rounded-full blur-[100px]"
            animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-72 h-72 bg-cc-yellow/6 rounded-full blur-[80px]"
            animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full">
          <div>
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cc-surface-container border border-cc-border rounded-full mb-6">
                <motion.span
                  className="w-2 h-2 rounded-full bg-[#e9c400]"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[11px] uppercase tracking-widest text-cc-yellow font-medium">Services Rapides</span>
              </div>
            </motion.div>

            {/* H1 */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-cc-text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Vos services du quotidien<br />en un{' '}
              <span className="gradient-text italic">clic.</span>
            </motion.h1>

            {/* Rotating phrase */}
            <AnimatePresence mode="wait">
              <motion.p
                key={heroIndex}
                className="text-base text-cc-text-secondary mb-8 max-w-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                {HERO_PHRASES[heroIndex]}
              </motion.p>
            </AnimatePresence>

            {/* Two CTA buttons */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base px-8 h-12 btn-glow-orange"
                onClick={onGoToClient}
              >
                Commander
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 border-cc-border text-cc-text-primary hover:bg-cc-surface-container-high hover:border-cc-text-secondary/20"
                onClick={onGoToClient}
              >
                Découvrir nos services
              </Button>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              className="flex items-center gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-cc-yellow">4.9/5</span>
                <span className="text-sm text-cc-text-secondary">note moyenne</span>
              </div>
              {stats && (
                <span className="text-sm text-cc-text-secondary">
                  <strong className="text-cc-text-primary">{stats.totalRecharges}</strong> services effectués
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scrolling ticker - comprehensive messages */}
      <div className="bg-cc-surface-dim border-y border-cc-border overflow-hidden py-3">
        <div className="animate-ticker flex whitespace-nowrap">
          {Array(3).fill(null).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4">
              <span className="text-cc-orange font-bold">ORANGE</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-yellow font-bold">MTN</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-blue font-bold">MOOV</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Service instantané</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Souscriptions forfaits</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Cartes physiques</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Paiement Wave & Djamo</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Code par WhatsApp</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-red-400 font-semibold">🔥 Vente Flash</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Paiement à la livraison</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Impression & photocopie</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Scan & plastification</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Photo minute</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-green-500 font-medium">✓ 100% Fiable</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Forfaits internet</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Bonus x2 Orange</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Data illimitée MTN</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Pass Moov</span>
              <span className="text-cc-text-secondary/30">•</span>
              <span className="text-cc-text-secondary">Client fidèle ⭐</span>
              <span className="text-cc-text-secondary/30">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flash Sale Slideshow - Product photos carousel */}
      <FlashSlideshow onBuyProduct={setSelectedFlashProduct} />

      {/* Promo & Services Carousel */}
      {promoCards.length > 0 && (
        <section className="py-10 bg-cc-page-bg">
          <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold text-cc-text-primary mb-4">Promotions & Services</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-2 px-4 sm:px-6">
            {promoCards.map((p: any) => {
              const isService = p.type === 'SERVICE'
              const opKey = p.operator || 'ORANGE'
              const opInfo = OPERATOR_INFO[opKey]
              const serviceCat = p.serviceCategory ? serviceCategoryLabels[p.serviceCategory] : null

              return (
                <div
                  key={p.id}
                  className={`min-w-[280px] rounded-xl p-5 snap-center flex flex-col justify-between relative overflow-hidden shrink-0 transition-smooth ${
                    isService
                      ? 'h-auto border-2 border-red-500/60 bg-gradient-to-br from-red-500/10 via-cc-surface-container to-orange-500/5'
                      : p.imageUrl
                        ? 'h-auto border border-cc-border bg-cc-surface-container'
                        : 'h-[160px] border border-cc-border bg-cc-surface-container'
                  }`}
                >
                  {/* NEW badge — sparkling animation */}
                  {p.isNew && (
                    <div className="absolute top-2 right-2 z-20">
                      <motion.div
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cc-orange border-2 border-cc-orange/60 shadow-lg shadow-cc-orange/30"
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">New</span>
                      </motion.div>
                    </div>
                  )}

                  {/* Glowing pulse on border for NEW items */}
                  {p.isNew && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-cc-orange/50 pointer-events-none"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {/* Publication/service image */}
                  {p.imageUrl && (
                    <div className="relative z-10 mb-3 -mx-5 -mt-5 rounded-t-xl overflow-hidden">
                      <img src={p.imageUrl} alt={p.title} className="w-full h-40 object-cover" />
                    </div>
                  )}
                  <div className="relative z-10">
                    {isService ? (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-cc-orange text-white text-xs">
                          SERVICE
                        </Badge>
                        {serviceCat && (
                          <Badge className="bg-cc-orange/15 text-cc-orange border border-cc-orange/25 text-xs">
                            {serviceCat.label}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge className={`${opInfo?.bg} ${opInfo?.color} text-xs mb-2`}>
                        {p.type || 'PROMO'}
                      </Badge>
                    )}
                    <h3 className="font-bold text-cc-text-primary text-lg pr-16">{p.title}</h3>
                  </div>
                  <p className="relative z-10 text-sm text-cc-text-secondary mt-2">{p.content}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Bento Stats Grid */}
      <section className="py-10 bg-cc-page-bg">
        <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Full-width: Transactions Réussies */}
            <div className="col-span-2 bento-cell bg-cc-surface-container border border-cc-border p-6 rounded-2xl">
              <div className="text-4xl font-bold text-primary-glow">
                {stats ? <AnimatedCounter target={stats.totalRecharges} /> : '—'}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-cc-text-secondary mt-2">Transactions Réussies</div>
            </div>
            {/* Utilisateurs */}
            <div className="bento-cell bg-cc-surface-container border border-cc-border p-6 rounded-2xl">
              <div className="text-3xl font-bold text-tertiary-dim">
                {stats ? <AnimatedCounter target={stats.totalClients} /> : '—'}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-cc-text-secondary mt-2">Clients</div>
            </div>
            {/* Temps Moyen */}
            <div className="bento-cell bg-cc-surface-container border border-cc-border p-6 rounded-2xl">
              <div className="text-3xl font-bold text-secondary-dim">&lt;30s</div>
              <div className="text-[11px] uppercase tracking-widest text-cc-text-secondary mt-2">Temps Moyen</div>
            </div>
          </div>
        </div>
      </section>

      {/* Operators section */}
      <section className="py-16 sm:py-20 bg-cc-surface-dim">
        <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-3">
              Tous nos services
            </h2>
            <p className="text-cc-text-secondary max-w-md mx-auto text-sm">
              Recharges, forfaits, cartes, vente flash et services bureautiques — identifiez votre opérateur automatiquement
            </p>
          </motion.div>

          <div className="flex justify-center gap-8 sm:gap-16">
            {Object.entries(OPERATOR_INFO).map(([key, info], index) => (
              <motion.div
                key={key}
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className={`w-20 h-20 rounded-full ${info.bg} ${info.color} flex items-center justify-center shadow-lg animate-float`} style={{ animationDelay: `${index * 0.5}s` }}>
                  <span className="text-2xl font-black">{info.name?.[0]}</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-cc-text-primary">{info.name}</p>
                  <p className="text-xs text-cc-text-secondary">Préfixe {info.prefix}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Physical Cards Section */}
      <div id="section-physical-cards">
        <PhysicalCardsSection onSeeMore={() => setShowPhysicalCatalog(true)} />
      </div>

      {/* Flash Sale Section - Full product grid */}
      <div id="section-flash-sale">
        <FlashSaleSection onBuyProduct={setSelectedFlashProduct} onSeeMore={() => setShowFlashCatalog(true)} />
      </div>

      {/* Documents à Traiter - Envoyer un document */}
      <DocumentsSection />

      {/* About Us Section */}
      <AboutUsSection />

      {/* Features */}
      <section id="section-features" className="py-16 sm:py-20 bg-cc-page-bg">
        <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-3">
              Pourquoi CLASS CENTER ?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Rapide', desc: 'Services instantanés, pas d\'attente' },
              { title: 'Sécurisé', desc: 'Vos données sont protégées' },
              { title: 'Paiement flexible', desc: 'Wave, Djamo ou paiement à la livraison' },
              { title: 'E-commerce', desc: 'Produits, cartes, forfaits et services' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', bounce: 0.4 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="glow-card h-full bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden relative group">
                  {/* Animated brand-orange top border */}
                  <div className="h-1 bg-cc-orange transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-1 text-cc-text-primary">{f.title}</h3>
                    <p className="text-sm text-cc-text-secondary">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA with particles */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-cc-blue to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 noise-overlay opacity-50" />
        {/* Animated particles - deterministic positions to avoid hydration mismatch */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { l: 5, t: 12, d: 3.2, dl: 0.3 }, { l: 15, t: 45, d: 4.1, dl: 1.1 }, { l: 22, t: 78, d: 3.5, dl: 2.4 },
            { l: 30, t: 23, d: 4.5, dl: 0.7 }, { l: 38, t: 67, d: 3.8, dl: 1.8 }, { l: 45, t: 34, d: 4.2, dl: 0.5 },
            { l: 52, t: 89, d: 3.6, dl: 2.1 }, { l: 60, t: 15, d: 4.8, dl: 0.9 }, { l: 67, t: 56, d: 3.3, dl: 1.5 },
            { l: 75, t: 82, d: 4.0, dl: 2.7 }, { l: 82, t: 28, d: 3.9, dl: 0.2 }, { l: 90, t: 61, d: 4.4, dl: 1.3 },
            { l: 10, t: 91, d: 3.7, dl: 2.0 }, { l: 18, t: 38, d: 4.6, dl: 0.8 }, { l: 35, t: 72, d: 3.4, dl: 1.6 },
            { l: 48, t: 19, d: 4.3, dl: 2.5 }, { l: 55, t: 53, d: 3.1, dl: 0.4 }, { l: 70, t: 86, d: 4.7, dl: 1.2 },
            { l: 85, t: 42, d: 3.6, dl: 2.3 }, { l: 95, t: 75, d: 4.1, dl: 0.6 },
          ].map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${p.l}%`,
                top: `${p.t}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: p.d,
                repeat: Infinity,
                delay: p.dl,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-[11px] uppercase tracking-widest text-white/80 font-medium">+2000 clients satisfaits</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Besoin d'un service ?
            </h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Rejoignez des milliers de clients qui font confiance à CLASS CENTER pour leurs recharges, forfaits, achats et services
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-white text-cc-blue hover:bg-blue-50 text-base px-10 h-12 font-bold btn-glow"
                onClick={onGoToClient}
              >
                Commander maintenant
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Flash Catalog Overlay */}
      <AnimatePresence>
        {showFlashCatalog && (
          <FlashCatalogOverlay
            onClose={() => setShowFlashCatalog(false)}
            onBuyProduct={(product) => { setShowFlashCatalog(false); setSelectedFlashProduct(product) }}
          />
        )}
      </AnimatePresence>

      {/* Physical Catalog Overlay */}
      <AnimatePresence>
        {showPhysicalCatalog && (
          <PhysicalCatalogOverlay
            onClose={() => setShowPhysicalCatalog(false)}
          />
        )}
      </AnimatePresence>

      {/* Flash Product Detail Overlay */}
      {selectedFlashProduct && (
        <FlashProductDetail
          product={selectedFlashProduct}
          onClose={() => setSelectedFlashProduct(null)}
        />
      )}
    </div>
  )
}
