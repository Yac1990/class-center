// ==========================================
// INPUT VALIDATION HELPERS
// ==========================================

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Validate phone number (Ivory Coast format) */
export function isValidPhone(phone: string): boolean {
  return /^(\+225|0)?[0-9]{8,10}$/.test(phone.replace(/\s/g, ''))
}

/** Validate positive integer amount */
export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= 10000000
}

/** Sanitize string input — trim and limit length */
export function sanitizeString(input: string, maxLength: number = 500): string {
  return input.trim().slice(0, maxLength)
}

/** Validate operator */
export function isValidOperator(operator: string): boolean {
  return ['ORANGE', 'MTN', 'MOOV', 'ALL'].includes(operator)
}

/** Validate transaction type */
export function isValidTransactionType(type: string): boolean {
  return ['RECHARGE', 'SUBSCRIPTION', 'PHYSICAL_CARD', 'FLASH_ORDER'].includes(type)
}

/** Validate payment method */
export function isValidPaymentMethod(method: string): boolean {
  return ['WAVE', 'DJAMO'].includes(method)
}

/** Validate transaction status */
export function isValidTransactionStatus(status: string): boolean {
  return ['PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)
}

/** Validate flash order status */
export function isValidOrderStatus(status: string): boolean {
  return ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)
}

/** Validate publication type */
export function isValidPublicationType(type: string): boolean {
  return ['PROMO', 'BONUS', 'INFO', 'SERVICE'].includes(type)
}

/** Validate product category */
export function isValidCategory(category: string): boolean {
  return ['general', 'electronics', 'fashion', 'phone', 'food', 'beauty', 'home', 'other'].includes(category)
}

/** Parse and validate integer from request */
export function parseSafeInt(value: any, defaultValue: number = 0): number {
  const parsed = parseInt(value)
  return Number.isFinite(parsed) ? parsed : defaultValue
}
