import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateCommission, detectOperator, maskPhone } from '@/lib/commissions';
import { sendNotificationEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const cabineId = searchParams.get('cabineId');

    let recharges;

    if (role === 'ADMIN') {
      recharges = await db.recharge.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else if (role === 'CABINE_MANAGER' && cabineId) {
      recharges = await db.recharge.findMany({
        where: { cabineId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else if (userId) {
      recharges = await db.recharge.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      // Mask phone numbers for client privacy
      recharges = recharges.map(r => ({ ...r, phone: maskPhone(r.phone) }));
    } else {
      recharges = await db.recharge.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      recharges = recharges.map(r => ({ ...r, phone: maskPhone(r.phone), commission: 0 }));
    }

    return NextResponse.json(recharges);
  } catch (error) {
    console.error('Get recharges error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientName, phone, operator, amount, userId, cabineId } = await request.json();

    if (!clientName || !phone || !amount) {
      return NextResponse.json({ error: 'Nom, téléphone et montant requis' }, { status: 400 });
    }

    const detectedOperator = operator || detectOperator(phone);
    if (detectedOperator === 'UNKNOWN') {
      return NextResponse.json({ error: 'Opérateur non reconnu. Préfixes: 07=Orange, 01=Moov, 04=MTN' }, { status: 400 });
    }

    const commission = calculateCommission(amount, detectedOperator);

    const recharge = await db.recharge.create({
      data: {
        clientName,
        phone,
        operator: detectedOperator,
        amount,
        commission,
        status: 'PENDING',
        userId: userId || null,
        cabineId: cabineId || null,
      },
    });

    // Send email notification to admin (non-blocking)
    sendNotificationEmail({
      type: 'RECHARGE',
      clientName,
      phone,
      amount,
      operator: detectedOperator,
    }).catch(err => console.error('Email notification failed:', err));

    return NextResponse.json(recharge, { status: 201 });
  } catch (error) {
    console.error('Create recharge error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const recharge = await db.recharge.findUnique({ where: { id } });
    if (!recharge) {
      return NextResponse.json({ error: 'Recharge non trouvée' }, { status: 404 });
    }

    // If validating (COMPLETED), deduct from SIM balance and increment action count
    if (status === 'COMPLETED' && recharge.status !== 'COMPLETED') {
      // Find the SIM balance for this operator
      // For admin (no cabineId), find SIMs without cabineId by filtering in JS
      let simBalance;
      if (recharge.cabineId) {
        simBalance = await db.sIMBalance.findFirst({
          where: { operator: recharge.operator, cabineId: recharge.cabineId },
        });
      } else {
        // Get all SIMs for this operator and filter for admin SIMs (no cabineId)
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

      // Increment action count for the user
      if (recharge.userId) {
        const user = await db.user.findUnique({ where: { id: recharge.userId } });
        if (user) {
          const newActionCount = user.actionCount + 1;
          const shouldBeLoyal = newActionCount >= 2;
          await db.user.update({
            where: { id: recharge.userId },
            data: {
              actionCount: newActionCount,
              isLoyal: shouldBeLoyal ? true : user.isLoyal,
              role: shouldBeLoyal ? 'LOYAL_CLIENT' : user.role,
            },
          });
        }
      }
    }

    const updated = await db.recharge.update({
      where: { id },
      data: { status },
    });

    // Also update the linked transaction status if exists
    if (status === 'COMPLETED' || status === 'FAILED') {
      const linkedTransaction = await db.transaction.findFirst({
        where: { rechargeId: id },
      });
      if (linkedTransaction) {
        await db.transaction.update({
          where: { id: linkedTransaction.id },
          data: { status: status === 'COMPLETED' ? 'COMPLETED' : 'FAILED' },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update recharge error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
