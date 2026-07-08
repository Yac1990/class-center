'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone, Menu, X, LogOut, Shield, UserCircle,
  Home, User, Settings, Store, Sun, Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { LoginDialog } from '@/components/login-dialog'
import { useTheme } from 'next-themes'

// ==========================================
// THEME TOGGLE BUTTON
// ==========================================
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <button className="w-9 h-9 rounded-lg bg-cc-surface-container-high/50 flex items-center justify-center">
        <div className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 rounded-lg bg-cc-surface-container-high/50 hover:bg-cc-surface-container-highest flex items-center justify-center transition-all duration-300 group"
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4 text-cc-yellow group-hover:text-cc-orange transition-colors" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

// ==========================================
// NAVBAR - Premium Glass (theme-aware)
// ==========================================
export function Navbar({ mobileMenuOpen, setMobileMenuOpen, loginOpen, setLoginOpen }: {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  loginOpen: boolean
  setLoginOpen: (v: boolean) => void
}) {
  const { user, isAdmin, isCabineManager, logout, activeSection, setActiveSection } = useAppStore()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-cc-border/50">
      <div className="max-w-[480px] md:max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <motion.div
            className="cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveSection('home')}
          >
            <img src="/images/logo.png" alt="CLASS CENTER" className="h-10 w-auto object-contain" />
          </motion.div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavButton label="Accueil" active={activeSection === 'home'} onClick={() => setActiveSection('home')} />
            <NavButton label="Espace Client" active={activeSection === 'client'} onClick={() => setActiveSection('client')} />

            {user && isAdmin && (
              <NavButton label="Administration" active={activeSection === 'admin'} onClick={() => setActiveSection('admin')} />
            )}
            {user && isCabineManager && (
              <NavButton label="Ma Cabine" active={activeSection === 'cabine'} onClick={() => setActiveSection('cabine')} />
            )}

            {/* Theme toggle */}
            <div className="ml-2">
              <ThemeToggle />
            </div>

            {user ? (
              <div className="flex items-center gap-3 ml-3">
                <span className="text-sm text-cc-text-secondary">Bonjour, <strong className="text-cc-text-primary">{user.name}</strong></span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { logout(); setActiveSection('home') }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Déconnexion
                </Button>
              </div>
            ) : (
              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <Button className="ml-3 bg-cc-blue hover:bg-blue-600 text-white btn-glow">
                    <UserCircle className="w-4 h-4 mr-1" /> Connexion
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface-container border-cc-border text-cc-text-primary">
                  <LoginDialog onSuccess={() => setLoginOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Mobile - account icon or hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <UserCircle className="w-6 h-6 text-cc-text-secondary" />
              </button>
            ) : (
              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-cc-blue hover:bg-blue-600 text-white btn-glow h-8 text-xs">
                    Connexion
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface-container border-cc-border text-cc-text-primary">
                  <LoginDialog onSuccess={() => setLoginOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
            <button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5 text-cc-text-secondary" /> : <Menu className="w-5 h-5 text-cc-text-secondary" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-cc-border"
            >
              <div className="py-3 space-y-1">
                <MobileNavButton
                  icon={Home}
                  label="Accueil"
                  description="Page principale"
                  active={activeSection === 'home'}
                  onClick={() => { setActiveSection('home'); setMobileMenuOpen(false) }}
                />
                <MobileNavButton
                  icon={User}
                  label="Espace Client"
                  description="Recharger & souscrire"
                  active={activeSection === 'client'}
                  onClick={() => { setActiveSection('client'); setMobileMenuOpen(false) }}
                />
                {user && isAdmin && (
                  <MobileNavButton
                    icon={Settings}
                    label="Administration"
                    description="Gérer le site"
                    active={activeSection === 'admin'}
                    onClick={() => { setActiveSection('admin'); setMobileMenuOpen(false) }}
                  />
                )}
                {user && isCabineManager && (
                  <MobileNavButton
                    icon={Store}
                    label="Ma Cabine"
                    description="Gérer ma cabine"
                    active={activeSection === 'cabine'}
                    onClick={() => { setActiveSection('cabine'); setMobileMenuOpen(false) }}
                  />
                )}

                {/* Separator */}
                <div className="border-t border-cc-border my-2" />

                {user ? (
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cc-orange to-cc-blue flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">{user.name?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cc-text-primary truncate">{user.name}</p>
                      <p className="text-xs text-cc-text-secondary truncate">{user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 h-8"
                      onClick={() => { logout(); setActiveSection('home'); setMobileMenuOpen(false) }}
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-cc-blue text-white btn-glow h-11">
                        <Shield className="w-4 h-4 mr-2" /> Connexion
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-surface-container border-cc-border text-cc-text-primary">
                      <LoginDialog onSuccess={() => { setLoginOpen(false); setMobileMenuOpen(false) }} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

function NavButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-smooth ${
        active
          ? 'bg-cc-blue/15 text-cc-blue'
          : 'text-cc-text-secondary hover:text-cc-text-primary hover:bg-cc-surface-container-high'
      }`}
    >
      {label}
    </button>
  )
}

function MobileNavButton({ icon: Icon, label, description, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-smooth ${
        active
          ? 'bg-cc-blue/10 border border-cc-blue/20'
          : 'hover:bg-cc-surface-container-high border border-transparent'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        active
          ? 'bg-cc-blue/20 text-cc-blue'
          : 'bg-cc-surface-container-high text-cc-text-secondary'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-left min-w-0">
        <p className={`text-sm font-semibold ${active ? 'text-cc-blue' : 'text-cc-text-primary'}`}>{label}</p>
        <p className="text-[11px] text-cc-text-secondary">{description}</p>
      </div>
    </button>
  )
}
