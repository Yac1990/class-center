import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabineId = searchParams.get('cabineId');
    const adminOnly = searchParams.get('adminOnly') === 'true';

    // Get all SIM balances and filter in JS to avoid Prisma null query issues
    const balances = await db.sIMBalance.findMany({
      orderBy: { operator: 'asc' },
    });

    let filtered = balances;
    if (adminOnly) {
      // Get SIMs without cabineId (admin's SIMs)
      filtered = balances.filter((b: any) => !b.cabineId);
    } else if (cabineId) {
      filtered = balances.filter((b: any) => b.cabineId === cabineId);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Get SIM balances error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { operator, phoneNumber, balance, cabineId, transactionNumbers } = await request.json();

    if (!operator || !phoneNumber) {
      return NextResponse.json({ error: 'Opérateur et numéro requis' }, { status: 400 });
    }

    // Check if a SIM with the same phone number already exists (unique per phone number)
    const allSims = await db.sIMBalance.findMany();
    const existing = allSims.find((s: any) => {
      // Match by phone number and same owner (admin or same cabine)
      if (s.phoneNumber !== phoneNumber) return false;
      if (cabineId) return s.cabineId === cabineId;
      return !s.cabineId;
    });

    if (existing) {
      // Update existing SIM with same phone number — merge transaction numbers
      const existingNums = (existing.transactionNumbers || '').split(',').filter(Boolean)
      const newNums = (transactionNumbers || '').split(',').filter(Boolean)
      const mergedNums = [...new Set([...existingNums, ...newNums])].join(',')

      const updated = await db.sIMBalance.update({
        where: { id: existing.id },
        data: {
          balance: balance !== undefined ? balance : existing.balance,
          transactionNumbers: mergedNums,
          lastRecharge: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    // Always create a new SIM — multiple SIMs per operator are allowed
    const simBalance = await db.sIMBalance.create({
      data: {
        operator,
        phoneNumber,
        balance: balance || 0,
        transactionNumbers: transactionNumbers || '',
        ...(cabineId ? { cabineId } : {}),
      },
    });

    return NextResponse.json(simBalance, { status: 201 });
  } catch (error) {
    console.error('Create SIM balance error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, amount, setBalance, transactionNumbers } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const current = await db.sIMBalance.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'SIM non trouvé' }, { status: 404 });
    }

    const newBalance = setBalance !== undefined ? setBalance : current.balance + (amount || 0);

    // Build update data
    const updateData: any = {
      balance: Math.max(newBalance, 0),
      lastRecharge: new Date(),
    }

    // Handle transaction numbers - append or replace
    if (transactionNumbers !== undefined) {
      if (typeof transactionNumbers === 'string' && transactionNumbers.startsWith('+')) {
        // Append mode: + means add to existing
        const newNums = transactionNumbers.substring(1).split(',').filter(Boolean)
        const existingNums = (current.transactionNumbers || '').split(',').filter(Boolean)
        updateData.transactionNumbers = [...new Set([...existingNums, ...newNums])].join(',')
      } else {
        // Replace mode
        updateData.transactionNumbers = transactionNumbers
      }
    }

    const updated = await db.sIMBalance.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Recharge SIM error:', error);
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

    await db.sIMBalance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete SIM balance error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
