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

    let subscriptions;

    if (role === 'ADMIN') {
      subscriptions = await db.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else if (role === 'CABINE_MANAGER' && cabineId) {
      subscriptions = await db.subscription.findMany({
        where: { cabineId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } else if (userId) {
      subscriptions = await db.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      subscriptions = subscriptions.map(s => ({ ...s, phone: maskPhone(s.phone) }));
    } else {
      subscriptions = await db.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      subscriptions = subscriptions.map(s => ({ ...s, phone: maskPhone(s.phone), commission: 0 }));
    }

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientName, phone, operator, planName, amount, userId, cabineId } = await request.json();

    if (!clientName || !phone || !planName || !amount) {
      return NextResponse.json({ error: 'Nom, téléphone, forfait et montant requis' }, { status: 400 });
    }

    const detectedOperator = operator || detectOperator(phone);
    if (detectedOperator === 'UNKNOWN') {
      return NextResponse.json({ error: 'Opérateur non reconnu' }, { status: 400 });
    }

    const commission = calculateCommission(amount, detectedOperator);

    const subscription = await db.subscription.create({
      data: {
        clientName,
        phone,
        operator: detectedOperator,
        planName,
        amount,
        commission,
        status: 'PENDING',
        userId: userId || null,
        cabineId: cabineId || null,
      },
    });

    // Send email notification to admin (non-blocking)
    sendNotificationEmail({
      type: 'SOUSCRIPTION',
      clientName,
      phone,
      amount,
      operator: detectedOperator,
      planName,
    }).catch(err => console.error('Email notification failed:', err));

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, clientName, phone, operator, planName, amount } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const data: any = {};
    if (status !== undefined) {
      if (!['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }
      data.status = status;
    }
    if (clientName !== undefined) data.clientName = clientName;
    if (phone !== undefined) data.phone = phone;
    if (operator !== undefined) data.operator = operator;
    if (planName !== undefined) data.planName = planName;
    if (amount !== undefined) data.amount = amount;

    // Recalculate commission if operator or amount changed
    if (data.operator || data.amount) {
      const sub = await db.subscription.findUnique({ where: { id } });
      if (sub) {
        const op = data.operator || sub.operator;
        const amt = data.amount || sub.amount;
        data.commission = calculateCommission(amt, op);
      }
    }

    // If validating (COMPLETED), deduct from SIM balance and increment action count
    if (status === 'COMPLETED') {
      const existingSub = await db.subscription.findUnique({ where: { id } });
      if (existingSub && existingSub.status !== 'COMPLETED') {
        // Find SIM balance - for admin (no cabineId), filter in JS to avoid Prisma null query issues
        let simBalance;
        if (existingSub.cabineId) {
          simBalance = await db.sIMBalance.findFirst({
            where: { operator: existingSub.operator, cabineId: existingSub.cabineId },
          });
        } else {
          const allSims = await db.sIMBalance.findMany({
            where: { operator: existingSub.operator },
          });
          simBalance = allSims.find((s: any) => !s.cabineId) || allSims[0] || null;
        }

        if (simBalance) {
          const newBalance = simBalance.balance - existingSub.amount;
          await db.sIMBalance.update({
            where: { id: simBalance.id },
            data: {
              balance: Math.max(newBalance, 0),
              lastRecharge: new Date(),
            },
          });
        }

        // Increment action count for the user
        if (existingSub.userId) {
          const user = await db.user.findUnique({ where: { id: existingSub.userId } });
          if (user) {
            const newActionCount = user.actionCount + 1;
            const shouldBeLoyal = newActionCount >= 2;
            await db.user.update({
              where: { id: existingSub.userId },
              data: {
                actionCount: newActionCount,
                isLoyal: shouldBeLoyal ? true : user.isLoyal,
                role: shouldBeLoyal ? 'LOYAL_CLIENT' : user.role,
              },
            });
          }
        }
      }
    }

    const subscription = await db.subscription.update({
      where: { id },
      data,
    });

    // Also update the linked transaction status if exists
    if (status === 'COMPLETED' || status === 'FAILED') {
      const linkedTransaction = await db.transaction.findFirst({
        where: { subscriptionId: id },
      });
      if (linkedTransaction) {
        await db.transaction.update({
          where: { id: linkedTransaction.id },
          data: { status: status === 'COMPLETED' ? 'COMPLETED' : 'FAILED' },
        });
      }
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
