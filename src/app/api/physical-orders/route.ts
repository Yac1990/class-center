import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const orders = await db.physicalOrder.findMany({
      where,
      include: { card: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Get physical orders error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.cardId || !data.clientName || !data.clientPhone || !data.amount) {
      return NextResponse.json({ error: 'Produit, nom, téléphone et montant requis' }, { status: 400 });
    }

    // Verify card exists and is active
    const card = await db.physicalCard.findUnique({ where: { id: data.cardId } });
    if (!card || !card.active) {
      return NextResponse.json({ error: 'Produit non disponible' }, { status: 400 });
    }

    // Check stock
    if (card.stock > 0) {
      const orderCount = await db.physicalOrder.count({
        where: { cardId: data.cardId, status: { notIn: ['CANCELLED'] } },
      });
      if (orderCount >= card.stock) {
        return NextResponse.json({ error: 'Stock épuisé' }, { status: 400 });
      }
    }

    const order = await db.physicalOrder.create({
      data: {
        cardId: data.cardId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        deliveryAddress: data.deliveryAddress || '',
        deliveryCity: data.deliveryCity || '',
        quantity: data.quantity || 1,
        amount: parseInt(data.amount),
        note: data.note || '',
      },
    });

    // Auto-capture for promotional purposes
    try {
      if (data.clientPhone) {
        await db.promotionalEmail.upsert({
          where: { email: `${data.clientPhone}@physical.classcenter.ci` },
          update: { name: data.clientName || '', source: 'FLASH_ORDER', active: true },
          create: {
            email: `${data.clientPhone}@physical.classcenter.ci`,
            name: data.clientName || '',
            source: 'FLASH_ORDER',
          },
        });
      }
    } catch (emailError) {
      console.error('Email capture error:', emailError);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create physical order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await db.physicalOrder.update({
      where: { id: data.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update physical order error:', error);
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

    await db.physicalOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete physical order error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
