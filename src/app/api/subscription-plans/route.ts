import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('showAll') === 'true';
    const operator = searchParams.get('operator');

    const where: any = {};
    if (!showAll) where.active = true;
    if (operator) where.operator = operator;

    const plans = await db.subscriptionPlan.findMany({
      where,
      orderBy: [{ operator: 'asc' }, { amount: 'asc' }],
    });

    // If no plans in DB yet, return default plans (seed on first access)
    if (plans.length === 0 && !showAll) {
      const defaultPlans = [
        { operator: 'ORANGE', name: 'Bon Plan 500', amount: 500, description: 'Appels + SMS + Data' },
        { operator: 'ORANGE', name: 'Bon Plan 1000', amount: 1000, description: 'Appels + SMS + Data illimité soir' },
        { operator: 'ORANGE', name: 'Bon Plan 2000', amount: 2000, description: 'Tout illimité week-end' },
        { operator: 'MTN', name: 'Forfait 500', amount: 500, description: 'Appels + SMS + Internet' },
        { operator: 'MTN', name: 'Forfait 1000', amount: 1000, description: 'Appels illimités + Data' },
        { operator: 'MTN', name: 'Forfait 2500', amount: 2500, description: 'Tout illimité 24h' },
        { operator: 'MOOV', name: 'Pass 500', amount: 500, description: 'Appels + Internet' },
        { operator: 'MOOV', name: 'Pass 1000', amount: 1000, description: 'Appels illimités + Data' },
        { operator: 'MOOV', name: 'Pass 2000', amount: 2000, description: 'Tout illimité' },
      ];

      // Seed default plans
      const created = await Promise.all(
        defaultPlans.map(plan => db.subscriptionPlan.create({ data: plan }))
      );

      return NextResponse.json(created);
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { operator, name, amount, description } = await request.json();

    if (!operator || !name || !amount) {
      return NextResponse.json({ error: 'Opérateur, nom et montant requis' }, { status: 400 });
    }

    if (!['ORANGE', 'MTN', 'MOOV'].includes(operator)) {
      return NextResponse.json({ error: 'Opérateur invalide' }, { status: 400 });
    }

    if (amount < 100 || amount > 100000) {
      return NextResponse.json({ error: 'Montant invalide (100-100000 FCFA)' }, { status: 400 });
    }

    const plan = await db.subscriptionPlan.create({
      data: { operator, name, amount, description: description || '' },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, operator, name, amount, description, active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const data: any = {};
    if (operator !== undefined) data.operator = operator;
    if (name !== undefined) data.name = name;
    if (amount !== undefined) data.amount = amount;
    if (description !== undefined) data.description = description;
    if (active !== undefined) data.active = active;

    const plan = await db.subscriptionPlan.update({
      where: { id },
      data,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Update subscription plan error:', error);
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

    await db.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
