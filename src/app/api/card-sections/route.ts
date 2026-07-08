import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List active card sections with their cards (public) or all (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    const withCards = searchParams.get('withCards') === 'true';

    const sections = await db.cardSection.findMany({
      where: showAll ? {} : { active: true },
      orderBy: { position: 'asc' },
      include: withCards ? {
        cards: {
          where: showAll ? {} : { active: true },
          orderBy: { position: 'asc' },
        },
      } : undefined,
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Get card sections error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Create a new card section (admin only)
export async function POST(request: NextRequest) {
  try {
    const { title, guideMessage, position, active } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }

    // Get max position if not provided
    let pos = position;
    if (pos === undefined || pos === null) {
      const maxSection = await db.cardSection.findFirst({
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      pos = (maxSection?.position ?? -1) + 1;
    }

    const section = await db.cardSection.create({
      data: {
        title,
        guideMessage: guideMessage || '',
        position: pos,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Create card section error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Update a card section
export async function PUT(request: NextRequest) {
  try {
    const { id, title, guideMessage, position, active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const section = await db.cardSection.findUnique({ where: { id } });
    if (!section) {
      return NextResponse.json({ error: 'Section non trouvée' }, { status: 404 });
    }

    const updated = await db.cardSection.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(guideMessage !== undefined && { guideMessage }),
        ...(position !== undefined && { position }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update card section error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Delete a card section
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Unlink all cards from this section before deleting
    await db.physicalCard.updateMany({
      where: { sectionId: id },
      data: { sectionId: null },
    });

    await db.cardSection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete card section error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
