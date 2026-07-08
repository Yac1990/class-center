import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabineId = searchParams.get('cabineId');
    const showAll = searchParams.get('showAll') === 'true';

    const where: any = {};
    if (cabineId) where.cabineId = cabineId;
    if (!showAll) where.active = true;

    const publications = await db.publication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: showAll ? 200 : 20,
    });

    return NextResponse.json(publications);
  } catch (error) {
    console.error('Get publications error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, operator, type, serviceCategory, imageUrl, isNew, cabineId, expiresAt } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Titre et contenu requis' }, { status: 400 });
    }

    const publication = await db.publication.create({
      data: {
        title,
        content,
        operator: operator || null,
        type: type || 'PROMO',
        serviceCategory: serviceCategory || null,
        imageUrl: imageUrl || '',
        isNew: isNew ?? false,
        cabineId: cabineId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(publication, { status: 201 });
  } catch (error) {
    console.error('Create publication error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, active, title, content, operator, type, serviceCategory, imageUrl, isNew, expiresAt } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const data: any = {};
    if (active !== undefined) data.active = active;
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (operator !== undefined) data.operator = operator;
    if (type !== undefined) data.type = type;
    if (serviceCategory !== undefined) data.serviceCategory = serviceCategory;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (isNew !== undefined) data.isNew = isNew;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const publication = await db.publication.update({
      where: { id },
      data,
    });

    return NextResponse.json(publication);
  } catch (error) {
    console.error('Update publication error:', error);
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

    await db.publication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete publication error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
