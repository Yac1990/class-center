import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const active = searchParams.get('active');

    const where: any = {};
    if (source) where.source = source;
    if (active !== null) where.active = active === 'true';

    const emails = await db.promotionalEmail.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Get promotional emails error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const email = await db.promotionalEmail.upsert({
      where: { email: data.email },
      update: { name: data.name || '', source: data.source || 'MANUAL', active: true },
      create: {
        email: data.email,
        name: data.name || '',
        source: data.source || 'MANUAL',
      },
    });

    return NextResponse.json(email, { status: 201 });
  } catch (error) {
    console.error('Create promotional email error:', error);
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
    await db.promotionalEmail.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete promotional email error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
