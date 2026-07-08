// ==========================================
// SHARED CONSTANTS - CLASS CENTER
// ==========================================

export const DJAMO_PAY_LINK = 'https://pay.djamo.com/8mu1o'
export const WAVE_PAY_LINK = 'https://pay.wave.com/m/M_xM5azSzKhAsr/c/ci/'
export const WHATSAPP_NUMBER = '+225 07 08 72 59 39'
export const WHATSAPP_LINK = `https://wa.me/2250708725939`

export const HERO_PHRASES = [
  "Il pleut et tu ne peux pas sortir ? Commandez vos services ici !",
  "Recharges, forfaits, cartes, impression et vente flash — tout en un clic",
  "Vos services du quotidien et achats en toute simplicité",
  "Orange, MTN, Moov — recharges, forfaits, impression et plus encore",
  "Le meilleur centre de services et e-commerce à portée de main",
]

export const OPERATOR_INFO: Record<string, { name: string; color: string; bg: string; prefix: string }> = {
  ORANGE: { name: 'Orange', color: 'text-white', bg: 'bg-gradient-to-r from-orange-500 to-orange-600', prefix: '07' },
  MTN: { name: 'MTN', color: 'text-slate-900', bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', prefix: '04' },
  MOOV: { name: 'Moov', color: 'text-white', bg: 'bg-gradient-to-r from-blue-600 to-blue-700', prefix: '01' },
}

export const THEME_OPTIONS = [
  { id: 'default', name: 'Classique', primary: '#2563EB', secondary: '#F97316', bg: '#FFFFFF' },
  { id: 'ocean', name: 'Océan', primary: '#0EA5E9', secondary: '#06B6D4', bg: '#F0F9FF' },
  { id: 'sunset', name: 'Coucher de soleil', primary: '#DC2626', secondary: '#F97316', bg: '#FFF7ED' },
  { id: 'forest', name: 'Forêt', primary: '#16A34A', secondary: '#84CC16', bg: '#F0FDF4' },
  { id: 'royal', name: 'Royal', primary: '#7C3AED', secondary: '#EC4899', bg: '#FAF5FF' },
]

export const SUBSCRIPTION_PLANS = [
  { operator: 'ORANGE', name: 'Bon Plan 500', amount: 500, description: 'Appels + SMS + Data' },
  { operator: 'ORANGE', name: 'Bon Plan 1000', amount: 1000, description: 'Appels + SMS + Data illimité soir' },
  { operator: 'ORANGE', name: 'Bon Plan 2000', amount: 2000, description: 'Tout illimité week-end' },
  { operator: 'MTN', name: 'Forfait 500', amount: 500, description: 'Appels + SMS + Internet' },
  { operator: 'MTN', name: 'Forfait 1000', amount: 1000, description: 'Appels illimités + Data' },
  { operator: 'MTN', name: 'Forfait 2500', amount: 2500, description: 'Tout illimité 24h' },
  { operator: 'MOOV', name: 'Pass 500', amount: 500, description: 'Appels + Internet' },
  { operator: 'MOOV', name: 'Pass 1000', amount: 1000, description: 'Appels illimités + Data' },
  { operator: 'MOOV', name: 'Pass 2000', amount: 2000, description: 'Tout illimité' },
]
