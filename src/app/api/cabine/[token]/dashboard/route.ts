import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const manager = await db.cabineManager.findUnique({
      where: { inviteToken: token },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Gérant non trouvé' }, { status: 404 });
    }

    const cabineId = manager.id;

    const totalRecharges = await db.recharge.aggregate({
      _sum: { amount: true, commission: true },
      _count: true,
      where: { cabineId },
    });

    const totalSubscriptions = await db.subscription.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { cabineId },
    });

    const recentRecharges = await db.recharge.findMany({
      where: { cabineId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentSubscriptions = await db.subscription.findMany({
      where: { cabineId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalClients = await db.user.count({
      where: { cabineId },
    });

    const pendingWavePayments = await db.wavePayment.count({
      where: { cabineId, status: 'PENDING' },
    });

    const simBalances = await db.sIMBalance.findMany({
      where: { cabineId },
    });

    return NextResponse.json({
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        theme: manager.theme,
        businessName: manager.businessName,
        waveNumber: manager.waveNumber,
      },
      stats: {
        totalRecharges: totalRecharges._count,
        totalRechargeAmount: totalRecharges._sum.amount || 0,
        totalCommission: totalRecharges._sum.commission || 0,
        totalSubscriptions: totalSubscriptions._count,
        totalSubscriptionAmount: totalSubscriptions._sum.amount || 0,
        totalClients,
        pendingWavePayments,
      },
      recentRecharges,
      recentSubscriptions,
      simBalances,
    });
  } catch (error) {
    console.error('Cabine dashboard error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
