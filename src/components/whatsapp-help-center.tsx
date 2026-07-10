'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_LINK } from '@/lib/constants'

// ==========================================
// FLOATING WHATSAPP BUTTON
// ==========================================

export function FloatingWhatsAppButton() {
  return (
    <motion.a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-[#25D366] shadow-xl shadow-[#25D366]/30 flex items-center justify-center group"
      aria-label="Contactez-nous sur WhatsApp"
    >
      {/* Pulsing ring */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
      <MessageCircle className="w-7 h-7 text-white relative" fill="white" />
      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-cc-surface-container border border-cc-border text-xs font-medium text-cc-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
        Contactez-nous
      </span>
    </motion.a>
  )
}
