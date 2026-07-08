import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const QUALIFYING_MIN_AMOUNT = 5000;

const LOYALTY_TIERS = {
  NONE: { threshold: 0, label: 'Nouveau', promoAmount: 0 },
  BRONZE: { threshold: 5, label: 'Client Fidèle', promoAmount: 0 },
  SILVER: { threshold: 25, label: 'Argent', promoAmount: 5000 },
  GOLD: { threshold: 50, label: 'Or', promoAmount: 10000 },
  PLATINUM: { threshold: 100, label: 'Platine', promoAmount: 25000 },
} as const;

type LoyaltyTier = keyof typeof LOYALTY_TIERS;

function determineTier(qualifyingCount: number): LoyaltyTier {
  if (qualifyingCount >= 100) return 'PLATINUM';
  if (qualifyingCount >= 50) return 'GOLD';
  if (qualifyingCount >= 25) return 'SILVER';
  if (qualifyingCount >= 5) return 'BRONZE';
  return 'NONE';
}

function generatePromoCodeStr(amount: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const kAmount = amount / 1000;
  return `CASH-${kAmount}K-${random}`;
}

// GET /api/admin/loyalty — list all loyal clients, stats, promo codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get all users with loyalty tier != NONE or actionCount > 0
    if (action === 'clients') {
      const clients = await db.user.findMany({
        where: {
          OR: [
            { loyaltyTier: { not: 'NONE' } },
            { actionCount: { gt: 0 } },
            { isLoyal: true },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          actionCount: true,
          isLoyal: true,
          loyaltyTier: true,
          loyaltyUnlockedAt: true,
          createdAt: true,
        },
        orderBy: { actionCount: 'desc' },
      });

      // Get promo codes for each client
      const clientsWithPromos = await Promise.all(
        clients.map(async (client) => {
          const promoCodes = await db.promoCode.findMany({
            where: { userId: client.id },
            orderBy: { createdAt: 'desc' },
          });

          // Count qualifying operations
          const qualifyingRecharges = await db.recharge.count({
            where: { userId: client.id, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
          });
          const qualifyingSubscriptions = await db.subscription.count({
            where: { userId: client.id, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
          });
          const qualifyingFlashOrders = await db.flashOrder.count({
            where: { userId: client.id, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }, amount: { gte: QUALIFYING_MIN_AMOUNT } },
          });
          const qualifyingPhysicalCards = await db.transaction.count({
            where: { userId: client.id, type: 'PHYSICAL_CARD', status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
          });

          const totalQualifyingOps = qualifyingRecharges + qualifyingSubscriptions + qualifyingFlashOrders + qualifyingPhysicalCards;
          const computedTier = determineTier(totalQualifyingOps);

          // Total spent
          const totalSpentRecharges = await db.recharge.aggregate({
            where: { userId: client.id, status: 'COMPLETED' },
            _sum: { amount: true },
          });
          const totalSpentSubscriptions = await db.subscription.aggregate({
            where: { userId: client.id, status: 'COMPLETED' },
            _sum: { amount: true },
          });
          const totalSpentFlashOrders = await db.flashOrder.aggregate({
            where: { userId: client.id, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
            _sum: { amount: true },
          });
          const totalSpentPhysicalCards = await db.transaction.aggregate({
            where: { userId: client.id, type: 'PHYSICAL_CARD', status: 'COMPLETED' },
            _sum: { amount: true },
          });

          const totalSpent =
            (totalSpentRecharges._sum.amount || 0) +
            (totalSpentSubscriptions._sum.amount || 0) +
            (totalSpentFlashOrders._sum.amount || 0) +
            (totalSpentPhysicalCards._sum.amount || 0);

          return {
            ...client,
            promoCodes,
            computedTier,
            totalQualifyingOps,
            breakdown: {
              recharges: qualifyingRecharges,
              subscriptions: qualifyingSubscriptions,
              flashOrders: qualifyingFlashOrders,
              physicalCards: qualifyingPhysicalCards,
            },
            totalSpent,
          };
        })
      );

      return NextResponse.json(clientsWithPromos);
    }

    // Get loyalty overview stats
    if (action === 'stats') {
      const totalClients = await db.user.count({
        where: { role: { in: ['CLIENT', 'LOYAL_CLIENT'] } },
      });
      const loyalClients = await db.user.count({
        where: { loyaltyTier: { not: 'NONE' } },
      });
      const bronzeClients = await db.user.count({ where: { loyaltyTier: 'BRONZE' } });
      const silverClients = await db.user.count({ where: { loyaltyTier: 'SILVER' } });
      const goldClients = await db.user.count({ where: { loyaltyTier: 'GOLD' } });
      const platinumClients = await db.user.count({ where: { loyaltyTier: 'PLATINUM' } });

      const activePromoCodes = await db.promoCode.count({ where: { status: 'ACTIVE' } });
      const usedPromoCodes = await db.promoCode.count({ where: { status: 'USED' } });
      const totalPromoValue = await db.promoCode.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
      });

      return NextResponse.json({
        totalClients,
        loyalClients,
        bronzeClients,
        silverClients,
        goldClients,
        platinumClients,
        activePromoCodes,
        usedPromoCodes,
        totalPromoValue: totalPromoValue._sum.amount || 0,
      });
    }

    // Get a specific client's loyalty detail
    if (action === 'client-detail') {
      const clientId = searchParams.get('clientId');
      if (!clientId) {
        return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
      }

      const user = await db.user.findUnique({
        where: { id: clientId },
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, actionCount: true, isLoyal: true,
          loyaltyTier: true, loyaltyUnlockedAt: true, createdAt: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
      }

      // Get full operation history
      const recharges = await db.recharge.findMany({
        where: { userId: clientId, status: 'COMPLETED' },
        select: { id: true, operator: true, amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const subscriptions = await db.subscription.findMany({
        where: { userId: clientId, status: 'COMPLETED' },
        select: { id: true, operator: true, planName: true, amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const flashOrders = await db.flashOrder.findMany({
        where: { userId: clientId, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
        select: { id: true, amount: true, quantity: true, createdAt: true, product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const physicalCards = await db.transaction.findMany({
        where: { userId: clientId, type: 'PHYSICAL_CARD', status: 'COMPLETED' },
        select: { id: true, cardName: true, amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });

      const promoCodes = await db.promoCode.findMany({
        where: { userId: clientId },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        user,
        history: { recharges, subscriptions, flashOrders, physicalCards },
        promoCodes,
      });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('Admin loyalty GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/loyalty — create promo code manually, recalculate loyalty
export async function POST(request: NextRequest) {
  try {
    const { action, userId, amount } = await request.json();

    if (action === 'grant-promo') {
      if (!userId || !amount) {
        return NextResponse.json({ error: 'userId et amount requis' }, { status: 400 });
      }

      const safeAmount = Math.min(Math.max(Number(amount), 0), 100000);
      if (safeAmount <= 0) {
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
      }

      // Generate a unique code
      let code = generatePromoCodeStr(safeAmount);
      let exists = await db.promoCode.findUnique({ where: { code } });
      while (exists) {
        code = generatePromoCodeStr(safeAmount);
        exists = await db.promoCode.findUnique({ where: { code } });
      }

      const promoCode = await db.promoCode.create({
        data: {
          code,
          amount: safeAmount,
          threshold: 0, // manually granted
          status: 'ACTIVE',
          userId,
        },
      });

      return NextResponse.json(promoCode, { status: 201 });
    }

    // Recalculate loyalty for a user
    if (action === 'recalculate') {
      if (!userId) {
        return NextResponse.json({ error: 'userId requis' }, { status: 400 });
      }

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Count qualifying operations
      const qualifyingRecharges = await db.recharge.count({
        where: { userId, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
      });
      const qualifyingSubscriptions = await db.subscription.count({
        where: { userId, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
      });
      const qualifyingFlashOrders = await db.flashOrder.count({
        where: { userId, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }, amount: { gte: QUALIFYING_MIN_AMOUNT } },
      });
      const qualifyingPhysicalCards = await db.transaction.count({
        where: { userId, type: 'PHYSICAL_CARD', status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
      });

      const totalQualifyingOps = qualifyingRecharges + qualifyingSubscriptions + qualifyingFlashOrders + qualifyingPhysicalCards;
      const currentTier = determineTier(totalQualifyingOps);
      const previousTier = (user.loyaltyTier as LoyaltyTier) || 'NONE';
      const tierChanged = currentTier !== previousTier;

      const updateData: any = {
        loyaltyTier: currentTier,
        actionCount: totalQualifyingOps,
      };

      if (currentTier !== 'NONE' && previousTier === 'NONE' && !user.loyaltyUnlockedAt) {
        updateData.loyaltyUnlockedAt = new Date();
      }

      if (currentTier !== 'NONE') {
        updateData.isLoyal = true;
        if (user.role === 'CLIENT') {
          updateData.role = 'LOYAL_CLIENT';
        }
      }

      await db.user.update({ where: { id: userId }, data: updateData });

      // If tier changed, generate promo codes for the new tier
      if (tierChanged && currentTier !== 'NONE' && currentTier !== 'BRONZE') {
        const tierInfo = LOYALTY_TIERS[currentTier];
        const existing = await db.promoCode.findFirst({
          where: { userId, threshold: tierInfo.threshold },
        });
        if (!existing) {
          let code = generatePromoCodeStr(tierInfo.promoAmount);
          let exists = await db.promoCode.findUnique({ where: { code } });
          while (exists) {
            code = generatePromoCodeStr(tierInfo.promoAmount);
            exists = await db.promoCode.findUnique({ where: { code } });
          }
          await db.promoCode.create({
            data: { code, amount: tierInfo.promoAmount, threshold: tierInfo.threshold, status: 'ACTIVE', userId },
          });
        }
      }

      return NextResponse.json({
        userId,
        previousTier,
        currentTier,
        totalQualifyingOps,
        tierChanged,
        breakdown: {
          recharges: qualifyingRecharges,
          subscriptions: qualifyingSubscriptions,
          flashOrders: qualifyingFlashOrders,
          physicalCards: qualifyingPhysicalCards,
        },
      });
    }

    // Bulk recalculate loyalty for ALL users — generates a full report
    if (action === 'bulk-recalculate') {
      const allUsers = await db.user.findMany({
        where: { role: { in: ['CLIENT', 'LOYAL_CLIENT'] } },
        select: { id: true, name: true, loyaltyTier: true, actionCount: true, isLoyal: true, role: true, loyaltyUnlockedAt: true },
      });

      let updated = 0;
      let tierChanges = 0;
      let newPromoCodes = 0;
      const details: Array<{ name: string; previousTier: string; currentTier: string; promoGenerated: boolean }> = [];

      for (const user of allUsers) {
        const qualifyingRecharges = await db.recharge.count({
          where: { userId: user.id, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
        });
        const qualifyingSubscriptions = await db.subscription.count({
          where: { userId: user.id, status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
        });
        const qualifyingFlashOrders = await db.flashOrder.count({
          where: { userId: user.id, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] }, amount: { gte: QUALIFYING_MIN_AMOUNT } },
        });
        const qualifyingPhysicalCards = await db.transaction.count({
          where: { userId: user.id, type: 'PHYSICAL_CARD', status: 'COMPLETED', amount: { gte: QUALIFYING_MIN_AMOUNT } },
        });

        const totalQualifyingOps = qualifyingRecharges + qualifyingSubscriptions + qualifyingFlashOrders + qualifyingPhysicalCards;
        const currentTier = determineTier(totalQualifyingOps);
        const previousTier = (user.loyaltyTier as LoyaltyTier) || 'NONE';
        const tierChanged = currentTier !== previousTier;

        const updateData: any = {
          loyaltyTier: currentTier,
          actionCount: totalQualifyingOps,
        };

        if (currentTier !== 'NONE' && previousTier === 'NONE' && !user.loyaltyUnlockedAt) {
          updateData.loyaltyUnlockedAt = new Date();
        }

        if (currentTier !== 'NONE') {
          updateData.isLoyal = true;
          if (user.role === 'CLIENT') {
            updateData.role = 'LOYAL_CLIENT';
          }
        }

        await db.user.update({ where: { id: user.id }, data: updateData });

        let promoGenerated = false;

        if (tierChanged && currentTier !== 'NONE' && currentTier !== 'BRONZE') {
          const tierInfo = LOYALTY_TIERS[currentTier];
          const existing = await db.promoCode.findFirst({
            where: { userId: user.id, threshold: tierInfo.threshold },
          });
          if (!existing) {
            let code = generatePromoCodeStr(tierInfo.promoAmount);
            let exists = await db.promoCode.findUnique({ where: { code } });
            while (exists) {
              code = generatePromoCodeStr(tierInfo.promoAmount);
              exists = await db.promoCode.findUnique({ where: { code } });
            }
            await db.promoCode.create({
              data: { code, amount: tierInfo.promoAmount, threshold: tierInfo.threshold, status: 'ACTIVE', userId: user.id },
            });
            promoGenerated = true;
            newPromoCodes++;
          }
        }

        if (tierChanged || totalQualifyingOps !== user.actionCount) {
          updated++;
        }
        if (tierChanged) {
          tierChanges++;
          details.push({ name: user.name, previousTier, currentTier, promoGenerated });
        }
      }

      return NextResponse.json({
        total: allUsers.length,
        updated,
        tierChanges,
        newPromoCodes,
        details,
      });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('Admin loyalty POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
