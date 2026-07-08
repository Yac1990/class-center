export const COMMISSION_RATES = {
  ORANGE: 0.06,
  MTN: 0.04,
  MOOV: 0.04,
} as const;

export function calculateCommission(amount: number, operator: string): number {
  const rate = COMMISSION_RATES[operator as keyof typeof COMMISSION_RATES] || 0;
  return Math.round(amount * rate);
}

export function detectOperator(phone: string): string {
  const prefix = phone.substring(0, 2);
  if (prefix === '07') return 'ORANGE';
  if (prefix === '01') return 'MOOV';
  if (prefix === '04') return 'MTN';
  return 'UNKNOWN';
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  const start = phone.substring(0, 4);
  const end = phone.substring(phone.length - 2);
  return `${start}***${end}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
}

/**
 * Format a phone number with spaces for readability
 * e.g. "07XXXXXXXX" → "07 XX XX XX XX"
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  // Format with spaces every 2 digits after the first 2
  const parts = [digits.substring(0, 2)]
  for (let i = 2; i < digits.length; i += 2) {
    parts.push(digits.substring(i, i + 2))
  }
  return parts.filter(Boolean).join(' ')
}

/**
 * Format a transaction/recharge code with dashes for readability
 * e.g. "123456789012" → "1234-5678-9012"
 */
export function formatTransactionCode(value: string, groupSize: number = 4): string {
  // Remove all non-alphanumeric characters
  const clean = value.replace(/[^a-zA-Z0-9]/g, '')
  const parts: string[] = []
  for (let i = 0; i < clean.length; i += groupSize) {
    parts.push(clean.substring(i, i + groupSize))
  }
  return parts.filter(Boolean).join('-')
}

/**
 * Strip formatting from a formatted number (remove spaces, dashes, etc.)
 */
export function stripFormatting(value: string): string {
  return value.replace(/[\s\-\.]/g, '')
}
