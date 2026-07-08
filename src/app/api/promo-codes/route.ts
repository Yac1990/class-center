import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // ACTIVE, USED, EXPIRED

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const where: any = { userId };
    if (status) where.status = status;

    const promoCodes = await db.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(promoCodes);
  } catch (error) {
    console.error('Get promo codes error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, userId, orderId, validateOnly } = await request.json();

    if (!code || !userId) {
      return NextResponse.json({ error: 'Code promo et userId requis' }, { status: 400 });
    }

    // Find the promo code (strip USE- prefix if present)
    const cleanCode = code.replace(/^USE-/, '')
    const promoCode = await db.promoCode.findUnique({
      where: { code: cleanCode },
    });

    if (!promoCode) {
      return NextResponse.json({ error: 'Code promo invalide' }, { status: 404 });
    }

    // Check ownership
    if (promoCode.userId !== userId) {
      return NextResponse.json({ error: 'Ce code promo ne vous appartient pas' }, { status: 403 });
    }

    // Check status
    if (promoCode.status === 'USED') {
      return NextResponse.json({ error: 'Ce code promo a déjà été utilisé' }, { status: 400 });
    }

    if (promoCode.status === 'EXPIRED') {
      return NextResponse.json({ error: 'Ce code promo a expiré' }, { status: 400 });
    }

    // Check expiry date if set
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      await db.promoCode.update({
        where: { id: promoCode.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Ce code promo a expiré' }, { status: 400 });
    }

    // If just validating (not using), return the amount without marking as used
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        amount: promoCode.amount,
        code: promoCode.code,
        message: `Code promo valide ! Cashback de ${promoCode.amount.toLocaleString()} FCFA`,
      });
    }

    // Mark the promo code as used
    const updated = await db.promoCode.update({
      where: { id: promoCode.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      promoCode: updated,
      cashbackAmount: updated.amount,
      message: `Code promo appliqué ! Cashback de ${updated.amount.toLocaleString()} FCFA`,
    });
  } catch (error) {
    console.error('Use promo code error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
