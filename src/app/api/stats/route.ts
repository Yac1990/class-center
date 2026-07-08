import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabineId = searchParams.get('cabineId');

    const whereClause = cabineId ? { cabineId } : {};

    const totalRecharges = await db.recharge.aggregate({
      _sum: { amount: true, commission: true },
      _count: true,
      where: whereClause,
    });

    const totalSubscriptions = await db.subscription.aggregate({
      _sum: { amount: true, commission: true },
      _count: true,
      where: whereClause,
    });

    const rechargesByOperator = await db.recharge.groupBy({
      by: ['operator'],
      _sum: { amount: true, commission: true },
      _count: true,
      where: whereClause,
    });

    const subscriptionsByOperator = await db.subscription.groupBy({
      by: ['operator'],
      _sum: { amount: true },
      _count: true,
      where: whereClause,
    });

    const recentRecharges = await db.recharge.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const totalClients = await db.user.count({
      where: cabineId ? { cabineId } : { role: 'CLIENT' },
    });

    const pendingRecharges = await db.recharge.count({
      where: { ...whereClause, status: 'PENDING' },
    });

    return NextResponse.json({
      totalRecharges: totalRecharges._count,
      totalRechargeAmount: totalRecharges._sum.amount || 0,
      totalCommission: totalRecharges._sum.commission || 0,
      totalSubscriptions: totalSubscriptions._count,
      totalSubscriptionAmount: totalSubscriptions._sum.amount || 0,
      totalSubscriptionCommission: totalSubscriptions._sum.commission || 0,
      rechargesByOperator,
      subscriptionsByOperator,
      recentRecharges,
      totalClients,
      pendingRecharges,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
