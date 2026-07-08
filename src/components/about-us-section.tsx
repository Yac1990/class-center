'use client'

import React from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Smartphone,
  CreditCard,
  ShoppingCart,
  Zap,
  Wifi,
  Printer,
  ScanLine,
  Layers,
  FileText,
  Camera,
  MessageCircle,
  Mail,
  MapPin,
  Users,
  Award,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from '@/lib/constants'

// ==========================================
// SERVICES DATA
// ==========================================
const digitalServices = [
  { icon: Smartphone, label: 'Rechargement mobile & données', sublabel: 'tous opérateurs' },
  { icon: CreditCard, label: 'Souscriptions forfaits', sublabel: '' },
  { icon: ShoppingCart, label: 'Cartes physiques', sublabel: '' },
  { icon: Zap, label: 'Vente Flash', sublabel: '' },
]

const bureauServices = [
  { icon: Wifi, label: 'Cyberspace & accès internet', sublabel: '' },
  { icon: Printer, label: 'Impression & photocopie', sublabel: '' },
  { icon: ScanLine, label: 'Scan & numérisation', sublabel: '' },
  { icon: Layers, label: 'Plastification & reliure', sublabel: '' },
  { icon: FileText, label: 'Traitement de texte', sublabel: '' },
  { icon: Camera, label: 'Photo minute', sublabel: 'passeport, identité' },
]

const stats = [
  { value: '5+', label: 'Années d\'expérience', icon: Award },
  { value: '2000+', label: 'Clients satisfaits', icon: Users },
  { value: '10K+', label: 'Transactions réussies', icon: Target },
]

const values = [
  { image: '/images/about/valeur-rapidite.png', title: 'Rapidité', desc: 'Un service instantané, sans attente inutile' },
  { image: '/images/about/valeur-confiance.jpg', title: 'Confiance', desc: 'Des milliers de clients nous font déjà confiance' },
  { image: '/images/about/valeur-excellence.png', title: 'Excellence', desc: 'Un engagement qualité dans chaque interaction' },
  { image: '/images/about/valeur-proximite.jpg', title: 'Proximité', desc: 'À l\'écoute de vos besoins au quotidien' },
]

// ==========================================
// STAGGERED CONTAINER
// ==========================================
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

const fadeIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// ==========================================
// ANIMATED COUNTER
// ==========================================
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="w-14 h-14 rounded-2xl bg-cc-orange/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-cc-orange" />
      </div>
      <div className="text-3xl sm:text-4xl font-black gradient-text mb-1">{value}</div>
      <div className="text-sm text-cc-text-secondary font-medium">{label}</div>
    </motion.div>
  )
}

// ==========================================
// SERVICE LIST ITEM
// ==========================================
function ServiceItem({ service, index }: { service: { icon: React.ElementType; label: string; sublabel: string }; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-3 p-3 rounded-xl border border-cc-border hover:border-cc-orange/20 hover:bg-cc-orange/[0.03] transition-all duration-300 group/item cursor-default"
      initial={{ opacity: 0, x: -16 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <div className="w-9 h-9 rounded-lg bg-cc-orange/10 text-cc-orange flex items-center justify-center shrink-0 group-hover/item:bg-cc-orange/20 transition-colors">
        <service.icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-cc-text-primary block leading-snug">{service.label}</span>
        {service.sublabel && <span className="text-xs text-cc-text-secondary block mt-0.5">{service.sublabel}</span>}
      </div>
      <ArrowRight className="w-4 h-4 text-cc-text-secondary/30 group-hover/item:text-cc-orange transition-all duration-300 group-hover/item:translate-x-1 shrink-0" />
    </motion.div>
  )
}

// ==========================================
// ABOUT US SECTION
// ==========================================
export function AboutUsSection() {
  const heroRef = React.useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true, margin: '-80px' })

  return (
    <section className="py-16 sm:py-24 bg-cc-page-bg relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-32 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[120px]"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]"
          animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      <div className="relative max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">

        {/* ==========================================
            A - VOTRE PARTENAIRE DE CONFIANCE
            ========================================== */}
        <motion.div
          ref={heroRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 sm:mb-24"
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Left - Text */}
          <div>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cc-surface-container border border-cc-border rounded-full mb-5">
                <span className="w-2 h-2 rounded-full bg-cc-orange animate-pulse" />
                <span className="text-[11px] uppercase tracking-widest text-cc-text-secondary font-medium">Qui sommes-nous</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-6 text-cc-text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Votre partenaire{' '}
              <span className="gradient-text">numérique</span>{' '}
              de confiance
            </motion.h2>

            {/* Description */}
            <motion.p
              className="text-cc-text-secondary text-base sm:text-lg leading-relaxed mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              CLASS CENTER est bien plus qu&apos;un simple centre de services.
              C&apos;est un espace où la technologie rencontre l&apos;humain,
              où chaque client est traité avec le soin et l&apos;attention qu&apos;il mérite.
              Nous rendons vos services du quotidien simples, rapides et accessibles.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              className="flex gap-8 sm:gap-12"
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl font-black gradient-text">{stat.value}</div>
                  <div className="text-xs text-cc-text-secondary mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Partenaire Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.92, x: 30 }}
            animate={heroInView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/images/about/partenaire.png"
                alt="CLASS Center - Votre partenaire de confiance"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Floating badge */}
              <motion.div
                className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/70 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                  <img src="/images/logo.png" alt="CLASS CENTER" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold text-cc-text-primary">Class Center</p>
                  <p className="text-[10px] text-cc-text-secondary">Abidjan, Côte d&apos;Ivoire</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* ==========================================
            B - NOS VALEURS - Cards with images
            ========================================== */}
        <motion.div
          className="mb-16 sm:mb-24"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div className="text-center mb-10" variants={fadeUp}>
            <h3 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-3">Nos valeurs</h3>
            <p className="text-cc-text-secondary max-w-md mx-auto text-sm">Ce qui nous anime au quotidien et guide chacune de nos actions</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeIn}
                className="bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden group hover:border-cc-orange/20 transition-all duration-300"
              >
                {/* Image at top */}
                <div className="h-28 sm:h-32 overflow-hidden bg-cc-orange/5 flex items-center justify-center p-4">
                  <img
                    src={v.image}
                    alt={v.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                {/* Text at bottom */}
                <div className="p-4 sm:p-5 text-center">
                  <h4 className="font-bold text-cc-text-primary text-base mb-1.5">{v.title}</h4>
                  <p className="text-xs sm:text-sm text-cc-text-secondary leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ==========================================
            C - NOS SERVICES - Two columns with images + text below
            ========================================== */}
        <motion.div
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl sm:text-3xl font-black text-cc-text-primary mb-3">Nos services</h3>
            <p className="text-cc-text-secondary max-w-md mx-auto text-sm">Tout ce dont vous avez besoin, en un seul endroit</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Digital Services */}
            <motion.div
              className="bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
            >
              {/* Image */}
              <div className="relative h-44 sm:h-52 overflow-hidden">
                <img
                  src="/images/about/service-numerique.png"
                  alt="Rechargement et services numériques"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cc-surface-container via-transparent to-transparent" />
              </div>
              {/* Text below the photo */}
              <div className="px-5 sm:px-6 pt-2 pb-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl font-black text-white shadow-lg">
                    1
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-cc-text-primary">Rechargement et services numériques</h4>
                </div>
              </div>

              {/* Services list */}
              <div className="p-5 sm:p-6 pt-3 space-y-2.5">
                {digitalServices.map((service, i) => (
                  <ServiceItem key={service.label} service={service} index={i} />
                ))}
              </div>
            </motion.div>

            {/* Bureau Services */}
            <motion.div
              className="bg-cc-surface-container border border-cc-border rounded-2xl overflow-hidden group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {/* Image */}
              <div className="relative h-44 sm:h-52 overflow-hidden">
                <img
                  src="/images/about/informatique-bureautique.jpg"
                  alt="Centre informatique et bureautique"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cc-surface-container via-transparent to-transparent" />
              </div>
              {/* Text below the photo */}
              <div className="px-5 sm:px-6 pt-2 pb-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cc-blue to-blue-700 flex items-center justify-center text-xl font-black text-white shadow-lg">
                    2
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-cc-text-primary">Centre informatique et bureautique</h4>
                </div>
              </div>

              {/* Services list */}
              <div className="p-5 sm:p-6 pt-3 space-y-2.5">
                {bureauServices.map((service, i) => (
                  <ServiceItem key={service.label} service={service} index={i} />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ==========================================
            MOTTO - Wide banner
            ========================================== */}
        <motion.div
          className="mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative bg-cc-surface-container border border-cc-border rounded-2xl px-6 py-5 sm:px-10 sm:py-8 text-center overflow-hidden">
            {/* Decorative side accents */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 via-cc-blue to-orange-500 rounded-l-2xl" />
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cc-blue via-orange-500 to-cc-blue rounded-r-2xl" />

            <p className="text-sm sm:text-base lg:text-lg font-bold tracking-widest uppercase text-cc-text-primary leading-relaxed">
              <span className="text-cc-orange">Professionnalisme</span>
              {' '}&{' '}
              <span className="text-cc-blue">Rapidité</span>
              {' '}pour vos besoins au quotidien
            </p>
          </div>
        </motion.div>

        {/* ==========================================
            D - NOTRE ÉQUIPE
            ========================================== */}
        <motion.div
          className="mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <img
              src="/images/about/equipe.jpg"
              alt="Notre équipe"
              className="w-full h-48 sm:h-64 lg:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 sm:px-12">
              <div className="max-w-md">
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Notre équipe, votre garantie</h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-5">
                  Chaque membre de notre équipe est formé pour vous offrir un service impeccable. Votre satisfaction est notre priorité absolue.
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-white/90 font-medium">Équipe professionnelle et à l&apos;écoute</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ==========================================
            CONTACT INFO ROW
            ========================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-cc-surface-container border border-cc-border hover:border-green-500/30 hover:bg-green-500/[0.04] transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-cc-text-secondary mb-0.5">WhatsApp</p>
                <p className="text-sm font-semibold text-cc-text-primary truncate">{WHATSAPP_NUMBER}</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:contact@classcenter.ci"
              className="flex items-center gap-3 p-4 rounded-xl bg-cc-surface-container border border-cc-border hover:border-orange-500/30 hover:bg-orange-500/[0.04] transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                <Mail className="w-5 h-5 text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-cc-text-secondary mb-0.5">Email</p>
                <p className="text-sm font-semibold text-cc-text-primary truncate">contact@classcenter.ci</p>
              </div>
            </a>

            {/* Address */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-cc-surface-container border border-cc-border hover:border-cc-blue/30 hover:bg-cc-blue/[0.04] transition-all duration-300 group">
              <div className="w-10 h-10 rounded-full bg-cc-blue/10 flex items-center justify-center shrink-0 group-hover:bg-cc-blue/20 transition-colors">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-cc-text-secondary mb-0.5">Adresse</p>
                <p className="text-sm font-semibold text-cc-text-primary">Abidjan, Côte d&apos;Ivoire</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
