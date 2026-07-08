import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabineId = searchParams.get('cabineId');

    if (!cabineId) {
      return NextResponse.json({ error: 'cabineId requis' }, { status: 400 });
    }

    const payments = await db.wavePayment.findMany({
      where: { cabineId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Get wave payments error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientName, clientPhone, amount, cabineId } = await request.json();

    if (!clientName || !clientPhone || !amount || !cabineId) {
      return NextResponse.json({ error: 'Nom, téléphone, montant et cabineId requis' }, { status: 400 });
    }

    const payment = await db.wavePayment.create({
      data: {
        clientName,
        clientPhone,
        amount,
        status: 'PENDING',
        cabineId,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Create wave payment error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'ID et statut requis' }, { status: 400 });
    }

    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const payment = await db.wavePayment.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Update wave payment error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
