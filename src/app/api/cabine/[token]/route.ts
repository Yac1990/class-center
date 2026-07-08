import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const manager = await db.cabineManager.findUnique({
      where: { inviteToken: token },
      include: {
        _count: { select: { clients: true, recharges: true, subscriptions: true } },
      },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Lien d\'invitation invalide' }, { status: 404 });
    }

    return NextResponse.json({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      theme: manager.theme,
      businessName: manager.businessName,
      waveNumber: manager.waveNumber,
      active: manager.active,
      hasPassword: manager.password !== '',
      clientCount: manager._count.clients,
    });
  } catch (error) {
    console.error('Get cabine by token error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    const manager = await db.cabineManager.findUnique({
      where: { inviteToken: token },
    });

    if (!manager) {
      return NextResponse.json({ error: 'Lien d\'invitation invalide' }, { status: 404 });
    }

    if (manager.password) {
      const valid = await verifyPassword(password, manager.password);
      if (!valid) {
        return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
      }
    } else {
      const hashed = await hashPassword(password);
      await db.cabineManager.update({
        where: { id: manager.id },
        data: { password: hashed },
      });
    }

    return NextResponse.json({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: 'CABINE_MANAGER',
      theme: manager.theme,
      businessName: manager.businessName,
      waveNumber: manager.waveNumber,
      inviteToken: manager.inviteToken,
    });
  } catch (error) {
    console.error('Cabine login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
