import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Qualifying operation: any recharge, subscription, flash order, or physical card purchase >= 5000 FCFA
const QUALIFYING_MIN_AMOUNT = 5000;

const LOYALTY_TIERS = {
  NONE: { threshold: 0, label: 'Nouveau', promoAmount: 0 },
  BRONZE: { threshold: 5, label: 'Client Fidèle', promoAmount: 0 },
  SILVER: { threshold: 25, label: 'Argent', promoAmount: 5000 },
  GOLD: { threshold: 50, label: 'Or', promoAmount: 10000 },
  PLATINUM: { threshold: 100, label: 'Platine', promoAmount: 25000 },
} as const;

type LoyaltyTier = keyof typeof LOYALTY_TIERS;

function generatePromoCode(amount: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const kAmount = amount / 1000;
  return `CASH-${kAmount}K-${random}`;
}

function determineTier(qualifyingCount: number): LoyaltyTier {
  if (qualifyingCount >= 100) return 'PLATINUM';
  if (qualifyingCount >= 50) return 'GOLD';
  if (qualifyingCount >= 25) return 'SILVER';
  if (qualifyingCount >= 5) return 'BRONZE';
  return 'NONE';
}

async function ensurePromoCodeForTier(userId: string, tier: LoyaltyTier): Promise<void> {
  const tierInfo = LOYALTY_TIERS[tier];
  if (!tierInfo.promoAmount) return; // NONE and BRONZE don't get promo codes

  // Check if user already has a promo code for this threshold
  const existing = await db.promoCode.findFirst({
    where: { userId, threshold: tierInfo.threshold },
  });
  if (existing) return; // Already generated

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

async function recalculateLoyalty(userId: string) {
  // Count qualifying recharges
  const qualifyingRecharges = await db.recharge.count({
    where: { userId, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
  });

  // Count qualifying subscriptions
  const qualifyingSubscriptions = await db.subscription.count({
    where: { userId, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
  });

  // Count qualifying flash orders
  const qualifyingFlashOrders = await db.flashOrder.count({
    where: { userId, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }, amount: { gte: QUALIFYING_MIN_AMOUNT } },
  });

  // Count qualifying physical card transactions
  const qualifyingPhysicalCards = await db.transaction.count({
    where: { userId, type: 'PHYSICAL_CARD', status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
  });

  const totalQualifyingOps = qualifyingRecharges + qualifyingSubscriptions + qualifyingFlashOrders + qualifyingPhysicalCards;

  const currentTier = determineTier(totalQualifyingOps);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const previousTier = (user.loyaltyTier as LoyaltyTier) || 'NONE';
  const tierChanged = currentTier !== previousTier;

  // Update user loyalty info
  const updateData: any = {
    loyaltyTier: currentTier,
    actionCount: totalQualifyingOps,
  };

  // If user just reached BRONZE (first unlock), set loyaltyUnlockedAt
  if (currentTier !== 'NONE' && previousTier === 'NONE' && !user.loyaltyUnlockedAt) {
    updateData.loyaltyUnlockedAt = new Date();
  }

  // Also keep isLoyal and role in sync for backward compatibility
  if (currentTier !== 'NONE') {
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
  if (tierChanged && currentTier !== 'NONE' && currentTier !== 'BRONZE') {
    await ensurePromoCodeForTier(userId, currentTier);
  }

  return {
    totalQualifyingOps,
    currentTier,
    previousTier,
    tierChanged,
    breakdown: {
      recharges: qualifyingRecharges,
      subscriptions: qualifyingSubscriptions,
      flashOrders: qualifyingFlashOrders,
      physicalCards: qualifyingPhysicalCards,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        actionCount: true,
        isLoyal: true,
        role: true,
        loyaltyTier: true,
        loyaltyUnlockedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Recalculate loyalty status
    const loyaltyResult = await recalculateLoyalty(userId);

    if (!loyaltyResult) {
      return NextResponse.json({ error: 'Erreur de calcul fidélité' }, { status: 500 });
    }

    // Get promo codes
    const promoCodes = await db.promoCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get qualifying operation history
    const qualifyingRecharges = await db.recharge.findMany({
      where: { userId, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
      select: { id: true, operator: true, amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const qualifyingSubscriptions = await db.subscription.findMany({
      where: { userId, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
      select: { id: true, operator: true, planName: true, amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const qualifyingFlashOrders = await db.flashOrder.findMany({
      where: { userId, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }, amount: { gte: QUALIFYING_MIN_AMOUNT } },
      select: { id: true, amount: true, quantity: true, createdAt: true, product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const qualifyingPhysicalCards = await db.transaction.findMany({
      where: { userId, type: 'PHYSICAL_CARD', status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
      select: { id: true, cardName: true, amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // Build badges list
    const badges: { tier: string; label: string; threshold: number; achieved: boolean; achievedAt?: Date | null }[] = [];
    for (const [tier, info] of Object.entries(LOYALTY_TIERS)) {
      if (tier === 'NONE') continue;
      const achieved = loyaltyResult.totalQualifyingOps >= info.threshold;
      badges.push({
        tier,
        label: info.label,
        threshold: info.threshold,
        achieved,
        achievedAt: achieved && user.loyaltyUnlockedAt ? user.loyaltyUnlockedAt : null,
      });
    }

    // Next tier info
    const tierOrder: LoyaltyTier[] = ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const currentIdx = tierOrder.indexOf(loyaltyResult.currentTier);
    const nextTier = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;
    const nextTierInfo = nextTier ? LOYALTY_TIERS[nextTier] : null;
    const opsToNextTier = nextTierInfo ? nextTierInfo.threshold - loyaltyResult.totalQualifyingOps : 0;

    // Total spent across all qualifying ops
    const totalSpentRecharges = await db.recharge.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalSpentSubscriptions = await db.subscription.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalSpentFlashOrders = await db.flashOrder.aggregate({
      where: { userId, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
      _sum: { amount: true },
    });
    const totalSpentPhysicalCards = await db.transaction.aggregate({
      where: { userId, type: 'PHYSICAL_CARD', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const totalSpent =
      (totalSpentRecharges._sum.amount || 0) +
      (totalSpentSubscriptions._sum.amount || 0) +
      (totalSpentFlashOrders._sum.amount || 0) +
      (totalSpentPhysicalCards._sum.amount || 0);

    return NextResponse.json({
      user: {
        ...user,
        loyaltyTier: loyaltyResult.currentTier,
        actionCount: loyaltyResult.totalQualifyingOps,
      },
      loyalty: {
        tier: loyaltyResult.currentTier,
        tierLabel: LOYALTY_TIERS[loyaltyResult.currentTier].label,
        qualifyingOpsCount: loyaltyResult.totalQualifyingOps,
        breakdown: loyaltyResult.breakdown,
        nextTier: nextTier ? {
          tier: nextTier,
          label: nextTierInfo!.label,
          opsNeeded: opsToNextTier,
          promoReward: nextTierInfo!.promoAmount,
        } : null,
        loyaltyUnlockedAt: user.loyaltyUnlockedAt,
      },
      badges,
      promoCodes,
      totalSpent,
      history: {
        recharges: qualifyingRecharges.map(r => ({ ...r, type: 'RECHARGE' })),
        subscriptions: qualifyingSubscriptions.map(s => ({ ...s, type: 'SUBSCRIPTION' })),
        flashOrders: qualifyingFlashOrders.map(f => ({ ...f, type: 'FLASH_ORDER' })),
        physicalCards: qualifyingPhysicalCards.map(p => ({ ...p, type: 'PHYSICAL_CARD' })),
      },
    });
  } catch (error) {
    console.error('Loyalty check error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
