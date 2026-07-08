import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const orders = await db.flashOrder.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get flash orders error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

interface CartItem {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Support both multi-item cart format and legacy single-product format
    let items: CartItem[] = [];
    const clientName = data.clientName;
    const clientPhone = data.clientPhone;
    const deliveryAddress = data.deliveryAddress || '';
    const deliveryCity = data.deliveryCity || '';
    const note = data.note || '';
    const userId = data.userId || null;

    if (!clientName || !clientPhone) {
      return NextResponse.json({ error: 'Nom et téléphone du client requis' }, { status: 400 });
    }

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      // Multi-item cart format
      items = data.items.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity || 1,
      }));
    } else if (data.productId) {
      // Legacy single-product format (backward compatibility)
      items = [{ productId: data.productId, quantity: data.quantity || 1 }];
    } else {
      return NextResponse.json({ error: 'Produit(s) requis (items ou productId)' }, { status: 400 });
    }

    // Validate all products exist and are active, and check stock
    const productIds = items.map(item => item.productId);
    const products = await db.flashProduct.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.active) {
        return NextResponse.json(
          { error: `Produit ${item.productId} non disponible` },
          { status: 400 }
        );
      }
      // Check stock
      if (product.stock > 0) {
        const orderCount = await db.flashOrder.count({
          where: { productId: item.productId, status: { notIn: ['CANCELLED'] } },
        });
        if (orderCount + item.quantity > product.stock) {
          return NextResponse.json(
            { error: `Stock insuffisant pour ${product.name}` },
            { status: 400 }
          );
        }
      }
    }

    // Create one FlashOrder per item
    const createdOrders = [];
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const order = await db.flashOrder.create({
        data: {
          productId: item.productId,
          clientName,
          clientPhone,
          deliveryAddress,
          deliveryCity,
          quantity: item.quantity,
          amount: product.price * item.quantity,
          note,
          userId,
        },
      });
      createdOrders.push(order);
    }

    // Auto-capture email for promotional purposes (from clientPhone)
    try {
      if (clientPhone) {
        await db.promotionalEmail.upsert({
          where: { email: `${clientPhone}@flash.classcenter.ci` },
          update: { name: clientName || '', source: 'FLASH_ORDER', active: true },
          create: {
            email: `${clientPhone}@flash.classcenter.ci`,
            name: clientName || '',
            source: 'FLASH_ORDER',
          },
        });
      }
    } catch (emailError) {
      // Don't fail the order if email capture fails
      console.error('Email capture error:', emailError);
    }

    return NextResponse.json(createdOrders, { status: 201 });
  } catch (error) {
    console.error('Create flash order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Loyalty helpers (same as in transactions route)
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

function generatePromoCodeStr(amount: number): string {
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
  if (!tierInfo.promoAmount) return;

  const existing = await db.promoCode.findFirst({
    where: { userId, threshold: tierInfo.threshold },
  });
  if (existing) return;

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

async function incrementLoyaltyForFlashOrder(userId: string | null, amount: number): Promise<void> {
  if (!userId || amount < 5000) return;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newActionCount = user.actionCount + 1;
  const newTier = determineTier(newActionCount);
  const previousTier = (user.loyaltyTier as LoyaltyTier) || 'NONE';
  const tierChanged = newTier !== previousTier;

  const updateData: any = { actionCount: newActionCount, loyaltyTier: newTier };

  if (newTier !== 'NONE' && previousTier === 'NONE' && !user.loyaltyUnlockedAt) {
    updateData.loyaltyUnlockedAt = new Date();
  }

  if (newTier !== 'NONE') {
    updateData.isLoyal = true;
    if (user.role === 'CLIENT') {
      updateData.role = 'LOYAL_CLIENT';
    }
  }

  await db.user.update({ where: { id: userId }, data: updateData });

  if (tierChanged && newTier !== 'NONE' && newTier !== 'BRONZE') {
    await ensurePromoCodeForTier(userId, newTier);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Get the current order before updating
    const existingOrder = await db.flashOrder.findUnique({
      where: { id: data.id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await db.flashOrder.update({
      where: { id: data.id },
      data: updateData,
    });

    // Increment loyalty when flash order is confirmed or delivered (amount >= 5000)
    if (data.status === 'CONFIRMED' || data.status === 'DELIVERED') {
      const wasPending = existingOrder.status === 'PENDING';
      const wasConfirmed = existingOrder.status === 'CONFIRMED';
      // Only increment if this is a new transition to confirmed/delivered
      if ((data.status === 'CONFIRMED' && wasPending) || (data.status === 'DELIVERED' && wasConfirmed)) {
        await incrementLoyaltyForFlashOrder(existingOrder.userId, existingOrder.amount);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update flash order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await db.flashOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete flash order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
