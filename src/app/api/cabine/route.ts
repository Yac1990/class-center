import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const managers = await db.cabineManager.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { clients: true, recharges: true, subscriptions: true } },
      },
    });
    return NextResponse.json(managers);
  } catch (error) {
    console.error('Get cabine managers error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, businessName } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 });
    }

    const existing = await db.cabineManager.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Un gérant avec cet email existe déjà' }, { status: 409 });
    }

    const inviteToken = crypto.randomUUID();
    const manager = await db.cabineManager.create({
      data: {
        name,
        email,
        password: '', // Will be set when they claim the account
        inviteToken,
        businessName: businessName || name,
      },
    });

    return NextResponse.json({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      inviteToken: manager.inviteToken,
      inviteLink: `/cabine/${manager.inviteToken}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Create cabine manager error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, theme, businessName, waveNumber, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (theme) data.theme = theme;
    if (businessName) data.businessName = businessName;
    if (waveNumber !== undefined) data.waveNumber = waveNumber;
    if (password) {
      data.password = await hashPassword(password);
    }

    const manager = await db.cabineManager.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      theme: manager.theme,
      businessName: manager.businessName,
      waveNumber: manager.waveNumber,
    });
  } catch (error) {
    console.error('Update cabine manager error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
