import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateCommission, detectOperator, maskPhone } from '@/lib/commissions';
import { sendNotificationEmail } from '@/lib/email';
import { isValidAmount, isValidPaymentMethod, isValidTransactionType, isValidOperator, sanitizeString, parseSafeInt } from '@/lib/validation';

function generateReference(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CC-${dateStr}-${random}`;
}

// ============================
// Loyalty helpers
// ============================

const LOYALTY_TIERS = {
  NONE: { threshold: 0, promoAmount: 0 },
  BRONZE: { threshold: 5, promoAmount: 0 },
  SILVER: { threshold: 25, promoAmount: 5000 },
  GOLD: { threshold: 50, promoAmount: 10000 },
  PLATINUM: { threshold: 100, promoAmount: 25000 },
} as const;

type LoyaltyTier = keyof typeof LOYALTY_TIERS;

function determineTier(qualifyingCount: number): LoyaltyTier {
  if (qualifyingCount >= 100) return 'PLATINUM';
  if (qualifyingCount >= 50) return 'GOLD';
  if (qualifyingCount >= 25) return 'SILVER';
  if (qualifyingCount >= 5) return 'BRONZE';
  return 'NONE';
}

function generatePromoCode(amount: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const kAmount = amount / 1000;
  return `CASH-${kAmount}K-${random}`;
}

async function ensurePromoCodeForTier(userId: string, tier: LoyaltyTier): Promise<void> {
  const tierInfo = LOYALTY_TIERS[tier];
  if (!tierInfo.promoAmount) return; // NONE and BRONZE don't get promo codes

  // Check if user already has a promo code for this threshold
  const existing = await db.promoCode.findFirst({
    where: { userId, threshold: tierInfo.threshold },
  });
  if (existing) return;

  // Generate a unique code
  let code = generatePromoCode(tierInfo.promoAmount);
  let exists = await db.promoCode.findUnique({ where: { code } });
  while (exists) {
    code = generatePromoCode(tierInfo.promoAmount);
    exists = await db.promoCode.findUnique({ where: { code } });
  }

  await db.promoCode.create({
    data: {
      code,
      amount: tierInfo.promoAmount,
      threshold: tierInfo.threshold,
      status: 'ACTIVE',
      userId,
    },
  });
}

async function incrementLoyaltyAction(userId: string | null, amount: number): Promise<void> {
  if (!userId || amount < 5000) return;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newActionCount = user.actionCount + 1;
  const newTier = determineTier(newActionCount);
  const previousTier = (user.loyaltyTier as LoyaltyTier) || 'NONE';
  const tierChanged = newTier !== previousTier;

  const updateData: any = {
    actionCount: newActionCount,
    loyaltyTier: newTier,
  };

  // If user just reached BRONZE (first unlock), set loyaltyUnlockedAt
  if (newTier !== 'NONE' && previousTier === 'NONE' && !user.loyaltyUnlockedAt) {
    updateData.loyaltyUnlockedAt = new Date();
  }

  // Keep isLoyal and role in sync for backward compatibility
  if (newTier !== 'NONE') {
    updateData.isLoyal = true;
    if (user.role === 'CLIENT') {
      updateData.role = 'LOYAL_CLIENT';
    }
  }

  await db.user.update({
    where: { id: userId },
    data: updateData,
  });

  // If tier changed and new tier has promo code, generate it
  if (tierChanged && newTier !== 'NONE' && newTier !== 'BRONZE') {
    await ensurePromoCodeForTier(userId, newTier);
  }
}

// ============================
// GET handler
// ============================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const cabineId = searchParams.get('cabineId');
    const reference = searchParams.get('reference');

    // Look up by reference (for progress tracking)
    if (reference) {
      const transaction = await db.transaction.findUnique({
        where: { reference },
      });
      if (!transaction) {
        return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
      }
      return NextResponse.json(transaction);
    }

    let transactions;

    if (role === 'ADMIN') {
      transactions = await db.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else if (role === 'CABINE_MANAGER' && cabineId) {
      transactions = await db.transaction.findMany({
        where: { cabineId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else if (userId) {
      transactions = await db.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      // Mask phone for privacy
      transactions = transactions.map(t => ({ ...t, phone: maskPhone(t.phone) }));
    } else {
      transactions = await db.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      transactions = transactions.map(t => ({ ...t, phone: maskPhone(t.phone), commission: 0 }));
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================
// POST handler
// ============================

export async function POST(request: NextRequest) {
  try {
    const { phone, clientName, amount, paymentMethod, type, planName, cardName, cardId, operator, userId, cabineId } = await request.json();

    if (!phone || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Numéro, montant et méthode de paiement requis' }, { status: 400 });
    }

    // Validate amount
    const safeAmount = parseSafeInt(amount, 0);
    if (!isValidAmount(safeAmount)) {
      return NextResponse.json({ error: 'Montant invalide (1 - 10 000 000 FCFA)' }, { status: 400 });
    }

    // Validate payment method
    if (!isValidPaymentMethod(paymentMethod.toUpperCase())) {
      return NextResponse.json({ error: 'Méthode de paiement invalide (WAVE ou DJAMO)' }, { status: 400 });
    }

    // Validate transaction type
    const safeType = type || 'RECHARGE';
    if (!isValidTransactionType(safeType)) {
      return NextResponse.json({ error: 'Type de transaction invalide' }, { status: 400 });
    }

    // Validate operator if provided
    if (operator && !isValidOperator(operator)) {
      return NextResponse.json({ error: 'Opérateur invalide' }, { status: 400 });
    }

    // For PHYSICAL_CARD type, use the provided operator directly
    let detectedOperator = operator;
    if (!detectedOperator || detectedOperator === 'UNKNOWN') {
      detectedOperator = detectOperator(phone);
    }
    if (!detectedOperator || detectedOperator === 'UNKNOWN') {
      detectedOperator = 'ALL';
    }

    const commission = (safeType === 'PHYSICAL_CARD') ? 0 : calculateCommission(amount, detectedOperator);

    // Generate unique reference
    let reference = generateReference();
    let exists = await db.transaction.findUnique({ where: { reference } });
    while (exists) {
      reference = generateReference();
      exists = await db.transaction.findUnique({ where: { reference } });
    }

    const transaction = await db.transaction.create({
      data: {
        reference,
        clientName: sanitizeString(clientName || '', 100),
        phone: sanitizeString(phone, 20),
        operator: detectedOperator,
        amount: safeAmount,
        paymentMethod: paymentMethod.toUpperCase(),
        type: safeType,
        planName: planName ? sanitizeString(planName, 100) : null,
        cardName: cardName ? sanitizeString(cardName, 100) : null,
        cardId: cardId ? sanitizeString(cardId, 50) : null,
        status: safeType === 'PHYSICAL_CARD' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING',
        commission,
        userId: userId ? sanitizeString(userId, 50) : null,
        cabineId: cabineId ? sanitizeString(cabineId, 50) : null,
      },
    });

    // When a FLASH_ORDER or PHYSICAL_CARD transaction is created, increment loyalty if amount >= 5000
    // PHYSICAL_CARD is auto-confirmed on creation, so we count it immediately
    if (safeType === 'FLASH_ORDER' || safeType === 'PHYSICAL_CARD') {
      await incrementLoyaltyAction(userId, safeAmount);
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================
// PUT handler
// ============================

export async function PUT(request: NextRequest) {
  try {
    const { id, reference, status } = await request.json();

    // Find by reference or id
    let transaction;
    if (reference) {
      transaction = await db.transaction.findUnique({ where: { reference } });
    } else if (id) {
      transaction = await db.transaction.findUnique({ where: { id } });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    const validStatuses = ['PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'PROCESSING', 'COMPLETED', 'FAILED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    // When payment is confirmed, auto-create the underlying recharge/subscription and move to PROCESSING
    if (status === 'PAYMENT_CONFIRMED' && transaction.status === 'PAYMENT_PENDING') {
      // Create the underlying record
      if (transaction.type === 'RECHARGE') {
        const recharge = await db.recharge.create({
          data: {
            clientName: transaction.clientName || transaction.phone,
            phone: transaction.phone,
            operator: transaction.operator,
            amount: transaction.amount,
            commission: transaction.commission,
            status: 'PENDING',
            userId: transaction.userId,
            cabineId: transaction.cabineId,
          },
        });

        // Send notification to admin
        sendNotificationEmail({
          type: 'RECHARGE',
          clientName: transaction.clientName || transaction.phone,
          phone: transaction.phone,
          amount: transaction.amount,
          operator: transaction.operator,
        }).catch(err => console.error('Email notification failed:', err));

        // Update transaction to PROCESSING with linked recharge
        const updated = await db.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'PROCESSING',
            rechargeId: recharge.id,
          },
        });

        return NextResponse.json(updated);
      } else if (transaction.type === 'SUBSCRIPTION') {
        const subscription = await db.subscription.create({
          data: {
            clientName: transaction.clientName || transaction.phone,
            phone: transaction.phone,
            operator: transaction.operator,
            planName: transaction.planName || 'Forfait',
            amount: transaction.amount,
            commission: transaction.commission,
            status: 'PENDING',
            userId: transaction.userId,
            cabineId: transaction.cabineId,
          },
        });

        // Send notification to admin
        sendNotificationEmail({
          type: 'SOUSCRIPTION',
          clientName: transaction.clientName || transaction.phone,
          phone: transaction.phone,
          amount: transaction.amount,
          operator: transaction.operator,
          planName: transaction.planName || 'Forfait',
        }).catch(err => console.error('Email notification failed:', err));

        // Update transaction to PROCESSING with linked subscription
        const updated = await db.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'PROCESSING',
            subscriptionId: subscription.id,
          },
        });

        return NextResponse.json(updated);
      }
    }

    // When admin marks the linked recharge/subscription as COMPLETED,
    // the transaction status should also be updated
    if (status === 'COMPLETED' && transaction.status === 'PROCESSING') {
      // Also update the linked recharge/subscription
      if (transaction.rechargeId) {
        await db.recharge.update({
          where: { id: transaction.rechargeId },
          data: { status: 'COMPLETED' },
        });

        // Deduct from SIM balance
        const recharge = await db.recharge.findUnique({ where: { id: transaction.rechargeId } });
        if (recharge) {
          let simBalance;
          if (recharge.cabineId) {
            simBalance = await db.sIMBalance.findFirst({
              where: { operator: recharge.operator, cabineId: recharge.cabineId },
            });
          } else {
            const allSims = await db.sIMBalance.findMany({
              where: { operator: recharge.operator },
            });
            simBalance = allSims.find((s: any) => !s.cabineId) || allSims[0] || null;
          }

          if (simBalance) {
            const newBalance = simBalance.balance - recharge.amount;
            await db.sIMBalance.update({
              where: { id: simBalance.id },
              data: {
                balance: Math.max(newBalance, 0),
                lastRecharge: new Date(),
              },
            });
          }

          // Increment loyalty action for qualifying recharges (amount >= 5000)
          if (recharge.userId) {
            await incrementLoyaltyAction(recharge.userId, recharge.amount);
          }
        }
      }

      if (transaction.subscriptionId) {
        await db.subscription.update({
          where: { id: transaction.subscriptionId },
          data: { status: 'COMPLETED' },
        });

        // Deduct from SIM balance and increment action count
        const sub = await db.subscription.findUnique({ where: { id: transaction.subscriptionId } });
        if (sub) {
          let simBalance;
          if (sub.cabineId) {
            simBalance = await db.sIMBalance.findFirst({
              where: { operator: sub.operator, cabineId: sub.cabineId },
            });
          } else {
            const allSims = await db.sIMBalance.findMany({
              where: { operator: sub.operator },
            });
            simBalance = allSims.find((s: any) => !s.cabineId) || allSims[0] || null;
          }

          if (simBalance) {
            const newBalance = simBalance.balance - sub.amount;
            await db.sIMBalance.update({
              where: { id: simBalance.id },
              data: {
                balance: Math.max(newBalance, 0),
                lastRecharge: new Date(),
              },
            });
          }

          // Increment loyalty action for qualifying subscriptions (amount >= 5000)
          if (sub.userId) {
            await incrementLoyaltyAction(sub.userId, sub.amount);
          }
        }
      }
    }

    // When a PHYSICAL_CARD transaction is completed, increment loyalty if amount >= 5000
    if (status === 'COMPLETED' && transaction.type === 'PHYSICAL_CARD' && transaction.userId) {
      await incrementLoyaltyAction(transaction.userId, transaction.amount);
    }

    // When marking as FAILED
    if (status === 'FAILED') {
      if (transaction.rechargeId) {
        await db.recharge.update({
          where: { id: transaction.rechargeId },
          data: { status: 'FAILED' },
        }).catch(() => {});
      }
      if (transaction.subscriptionId) {
        await db.subscription.update({
          where: { id: transaction.subscriptionId },
          data: { status: 'FAILED' },
        }).catch(() => {});
      }
    }

    // Simple status update
    const updated = await db.transaction.update({
      where: { id: transaction.id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
