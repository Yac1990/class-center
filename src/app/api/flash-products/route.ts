import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    const category = searchParams.get('category');

    const where: any = {};
    if (!showAll) where.active = true;
    if (category) where.category = category;

    const products = await db.flashProduct.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { position: 'asc' }],
      include: { _count: { select: { orders: true } } },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Get flash products error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.name || !data.price) {
      return NextResponse.json({ error: 'Nom et prix requis' }, { status: 400 });
    }

    const product = await db.flashProduct.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: parseInt(data.price),
        originalPrice: data.originalPrice ? parseInt(data.originalPrice) : 0,
        images: data.images || '',
        category: data.category || 'general',
        stock: data.stock !== undefined ? parseInt(data.stock) : -1,
        active: data.active !== undefined ? data.active : true,
        featured: data.featured || false,
        position: data.position ? parseInt(data.position) : 0,
        saleEndsAt: data.saleEndsAt ? new Date(data.saleEndsAt) : null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create flash product error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = parseInt(data.price);
    if (data.originalPrice !== undefined) updateData.originalPrice = parseInt(data.originalPrice);
    if (data.images !== undefined) updateData.images = data.images;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.active !== undefined) updateData.active = data.active;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.position !== undefined) updateData.position = parseInt(data.position);
    if (data.saleEndsAt !== undefined) updateData.saleEndsAt = data.saleEndsAt ? new Date(data.saleEndsAt) : null;
    if (data.like !== undefined) {
      // Increment or decrement likes
      const current = await db.flashProduct.findUnique({ where: { id: data.id }, select: { likes: true } });
      if (current !== null) {
        updateData.likes = data.like ? Math.max(0, current.likes + 1) : Math.max(0, current.likes - 1);
      }
    }

    const updated = await db.flashProduct.update({
      where: { id: data.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update flash product error:', error);
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

    await db.flashOrder.deleteMany({ where: { productId: id } });
    await db.flashProduct.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete flash product error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
