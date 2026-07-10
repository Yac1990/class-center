'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'

// ==========================================
// LOGIN DIALOG
// ==========================================
export function LoginDialog({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const { setUser, setActiveSection } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Erreur de connexion')
          return
        }
        setUser(data)
        if (data.role === 'ADMIN') setActiveSection('admin')
        else if (data.role === 'CABINE_MANAGER') setActiveSection('cabine')
        else setActiveSection('client')
        onSuccess()
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Erreur lors de la création du compte')
          return
        }
        setUser(data)
        setActiveSection('client')
        onSuccess()
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="text-cc-text-primary">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</DialogTitle>
        <DialogDescription className="text-cc-text-secondary">
          {mode === 'login' ? 'Connectez-vous à votre compte CLASS CENTER' : 'Créez votre compte pour accéder à tous les services'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Inline error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-2">
            <Label className="text-cc-text-secondary">Nom complet</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" required className="bg-cc-surface-container-high border-cc-border text-cc-text-primary placeholder:text-cc-text-secondary/50" />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-cc-text-secondary">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required className="bg-cc-surface-container-high border-cc-border text-cc-text-primary placeholder:text-cc-text-secondary/50" />
        </div>
        {mode === 'register' && (
          <div className="space-y-2">
            <Label className="text-cc-text-secondary">Téléphone</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="bg-cc-surface-container-high border-cc-border text-cc-text-primary placeholder:text-cc-text-secondary/50" />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-cc-text-secondary">Mot de passe</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-cc-surface-container-high border-cc-border text-cc-text-primary placeholder:text-cc-text-secondary/50" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-cc-text-secondary" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full bg-cc-blue hover:bg-cc-blue/90 text-white btn-glow" disabled={loading}>
          {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
        </Button>
        <p className="text-center text-sm text-cc-text-secondary">
          {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
          <button type="button" className="text-cc-blue font-medium hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </form>
    </div>
  )
}
