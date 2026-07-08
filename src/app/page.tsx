'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { WHATSAPP_NUMBER } from '@/lib/constants'
import { Navbar } from '@/components/navbar'
import { LandingPage } from '@/components/landing-page'
import { ClientSpace } from '@/components/client-space'
import { AdminDashboard } from '@/components/admin-dashboard'
import { CabineManagerDashboard } from '@/components/cabine-dashboard'
import { LegalPage } from '@/components/legal-page'
import { CartOverlay, FloatingCartButton } from '@/components/cart-overlay'
import { FloatingWhatsAppButton } from '@/components/whatsapp-help-center'

// ==========================================
// NEWSLETTER IN FOOTER
// ==========================================
function FooterNewsletter() {
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
          setStatus('success')
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
    <div className="mt-4">
      <p className="text-sm text-cc-text-secondary mb-2">Restez informé de nos offres</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          required
          className="flex-1 h-9 px-3 text-sm bg-cc-surface-container border border-cc-border rounded-lg text-cc-text-primary placeholder:text-cc-text-secondary/50 focus:outline-none focus:border-cc-orange/50"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="h-9 px-4 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50 shrink-0"
        >
          {status === 'loading' ? 'Envoi...' : status === 'success' ? 'Inscrit !' : "S'inscrire"}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-500 mt-1">Erreur. Réessayez.</p>
      )}
      {status === 'success' && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Merci pour votre inscription !</p>
      )}
    </div>
  )
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function Home() {
  const { user, isAdmin, isCabineManager, activeSection, legalPage, setActiveSection, setLegalPage, checkSession } = useAppStore()
  const [heroIndex, setHeroIndex] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  // Restore session on mount
  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Hero phrase rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % 5)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Check URL for cabine token or flash product hash
  const [cabineToken, setCabineToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash.startsWith('#cabine=')) {
        return hash.replace('#cabine=', '')
      }
    }
    return null
  })

  const isClient = activeSection === 'client'

  // Handle hash navigation for flash products (SPA routing)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash.startsWith('#flash-')) {
        // Navigate to home and let flash section handle it
        if (activeSection !== 'home') {
          setActiveSection('home')
        }
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [activeSection, setActiveSection])

  // If legal page is set, show it instead of normal content
  if (legalPage) {
    return (
      <div className="min-h-screen flex flex-col bg-cc-page-bg">
        <Navbar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          loginOpen={loginOpen}
          setLoginOpen={setLoginOpen}
        />
        <main className="flex-1">
          <LegalPage page={legalPage} />
        </main>
        <footer className="bg-cc-surface-dim border-t border-cc-border text-cc-text-primary mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <img src="/images/logo.png" alt="CLASS CENTER" className="h-12 w-auto object-contain mb-2" />
                <p className="text-sm text-cc-text-secondary">Services et achats en ligne — tout en un clic en Côte d&apos;Ivoire.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-cc-text-primary">Contact</h4>
                <ul className="text-sm text-cc-text-secondary space-y-1">
                  <li>Abidjan, Côte d&apos;Ivoire</li>
                  <li><a href={`https://wa.me/2250708725939`} target="_blank" rel="noopener noreferrer" className="hover:text-cc-orange transition-smooth">WhatsApp: {WHATSAPP_NUMBER}</a></li>
                  <li><a href="mailto:supportclasscenter@gmail.com" className="hover:text-cc-orange transition-smooth">supportclasscenter@gmail.com</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-cc-text-primary">Légal</h4>
                <ul className="text-sm text-cc-text-secondary space-y-1">
                  <li><button onClick={() => setLegalPage('privacy')} className="hover:text-cc-orange transition-smooth text-left">Politique de confidentialité</button></li>
                  <li><button onClick={() => setLegalPage('returns')} className="hover:text-cc-orange transition-smooth text-left">Politique de non-retour</button></li>
                  <li><button onClick={() => setLegalPage('terms')} className="hover:text-cc-orange transition-smooth text-left">Conditions générales</button></li>
                  <li><button onClick={() => setLegalPage('legal')} className="hover:text-cc-orange transition-smooth text-left">Mentions légales</button></li>
                </ul>
              </div>
            </div>
            <Separator className="my-6 bg-cc-border" />
            <p className="text-center text-sm text-cc-text-secondary/60">&copy; {new Date().getFullYear()} CLASS CENTER. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-cc-page-bg">
      {/* Navbar */}
      <Navbar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        loginOpen={loginOpen}
        setLoginOpen={setLoginOpen}
      />

      {/* Main content based on section */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {user && isAdmin && activeSection === 'admin' ? (
            <AdminDashboard key="admin" />
          ) : user && isCabineManager && activeSection === 'cabine' ? (
            <CabineManagerDashboard key="cabine" token={cabineToken || user.cabineToken || ''} />
          ) : activeSection === 'client' ? (
            <ClientSpace key="client" cabineToken={cabineToken} />
          ) : (
            <LandingPage key="landing" heroIndex={heroIndex} onGoToClient={() => setActiveSection('client')} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer - hidden on client space */}
      <FloatingCartButton />
      <FloatingWhatsAppButton />
      <CartOverlay />

      {!isClient && (
        <footer className="bg-cc-surface-dim border-t border-cc-border text-cc-text-primary mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <img src="/images/logo.png" alt="CLASS CENTER" className="h-12 w-auto object-contain mb-2" />
                <p className="text-sm text-cc-text-secondary mb-4">Services et achats en ligne — tout en un clic en Côte d&apos;Ivoire.</p>
                <FooterNewsletter />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-cc-text-primary">Services</h4>
                <ul className="text-sm text-cc-text-secondary space-y-1">
                  <li><button onClick={() => { setActiveSection('client'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="hover:text-cc-orange transition-smooth text-left">Recharges mobiles</button></li>
                  <li><button onClick={() => { setActiveSection('client'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="hover:text-cc-orange transition-smooth text-left">Souscriptions forfaits</button></li>
                  <li><button onClick={() => { setActiveSection('home'); setTimeout(() => document.getElementById('section-physical-cards')?.scrollIntoView({ behavior: 'smooth' }), 100) }} className="hover:text-cc-orange transition-smooth text-left">Cartes physiques</button></li>
                  <li><button onClick={() => { setActiveSection('home'); setTimeout(() => document.getElementById('section-flash-sale')?.scrollIntoView({ behavior: 'smooth' }), 100) }} className="hover:text-cc-orange transition-smooth text-left">Vente Flash</button></li>
                  <li><button onClick={() => { setActiveSection('home'); setTimeout(() => document.getElementById('section-documents')?.scrollIntoView({ behavior: 'smooth' }), 100) }} className="hover:text-cc-orange transition-smooth text-left">Documents à traiter</button></li>
                  <li><button onClick={() => { setActiveSection('home'); setTimeout(() => document.getElementById('section-help-center')?.scrollIntoView({ behavior: 'smooth' }), 100) }} className="hover:text-cc-orange transition-smooth text-left">Centre d&apos;aide WhatsApp</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-cc-text-primary">Contact</h4>
                <ul className="text-sm text-cc-text-secondary space-y-1">
                  <li>Abidjan, Côte d&apos;Ivoire</li>
                  <li><a href={`https://wa.me/2250708725939`} target="_blank" rel="noopener noreferrer" className="hover:text-cc-orange transition-smooth">WhatsApp: {WHATSAPP_NUMBER}</a></li>
                  <li><a href="mailto:supportclasscenter@gmail.com" className="hover:text-cc-orange transition-smooth">supportclasscenter@gmail.com</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-cc-text-primary">Légal</h4>
                <ul className="text-sm text-cc-text-secondary space-y-1">
                  <li><button onClick={() => setLegalPage('privacy')} className="hover:text-cc-orange transition-smooth text-left">Politique de confidentialité</button></li>
                  <li><button onClick={() => setLegalPage('returns')} className="hover:text-cc-orange transition-smooth text-left">Politique de non-retour</button></li>
                  <li><button onClick={() => setLegalPage('terms')} className="hover:text-cc-orange transition-smooth text-left">Conditions générales</button></li>
                  <li><button onClick={() => setLegalPage('legal')} className="hover:text-cc-orange transition-smooth text-left">Mentions légales</button></li>
                </ul>
              </div>
            </div>
            <Separator className="my-6 bg-cc-border" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-cc-text-secondary/60">&copy; {new Date().getFullYear()} CLASS CENTER. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
