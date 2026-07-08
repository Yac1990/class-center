import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List active physical cards (public) or all (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    const sectionId = searchParams.get('sectionId');

    const where: any = showAll ? {} : { active: true };
    if (sectionId) {
      where.sectionId = sectionId;
    }

    const cards = await db.physicalCard.findMany({
      where,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Get physical cards error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Create a new physical card (admin only)
export async function POST(request: NextRequest) {
  try {
    const { name, description, price, imageUrl, operator, active, stock, sectionId, position } = await request.json();

    if (!name || !price) {
      return NextResponse.json({ error: 'Nom et prix requis' }, { status: 400 });
    }

    // Get max position in section if not provided
    let pos = position || 0;
    if (!position && position !== 0) {
      const maxCard = await db.physicalCard.findFirst({
        where: sectionId ? { sectionId } : {},
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      pos = (maxCard?.position ?? -1) + 1;
    }

    const card = await db.physicalCard.create({
      data: {
        name,
        description: description || '',
        price,
        imageUrl: imageUrl || '',
        operator: operator || 'ALL',
        active: active !== undefined ? active : true,
        stock: stock || -1,
        sectionId: sectionId || null,
        position: pos,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Create physical card error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Update a physical card
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, price, imageUrl, operator, active, stock, sectionId, position } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const card = await db.physicalCard.findUnique({ where: { id } });
    if (!card) {
      return NextResponse.json({ error: 'Carte non trouvée' }, { status: 404 });
    }

    const updated = await db.physicalCard.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(operator !== undefined && { operator }),
        ...(active !== undefined && { active }),
        ...(stock !== undefined && { stock }),
        ...(sectionId !== undefined && { sectionId }),
        ...(position !== undefined && { position }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update physical card error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Delete a physical card
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await db.physicalCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete physical card error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
