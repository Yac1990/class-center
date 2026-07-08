import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ==========================================
// REPORTS API - Daily / Weekly / Monthly / Yearly
// Includes: Recharges, Subscriptions, Physical Card Sales
// ==========================================

function getDateRange(period: string, dateStr?: string): { start: Date; end: Date; label: string } {
  const now = new Date()
  const target = dateStr ? new Date(dateStr) : now

  switch (period) {
    case 'daily': {
      const start = new Date(target)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { start, end, label: `Journalier — ${start.toLocaleDateString('fr-FR')}` }
    }
    case 'weekly': {
      const dayOfWeek = target.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const start = new Date(target)
      start.setDate(start.getDate() + mondayOffset)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return { start, end, label: `Hebdomadaire — Semaine du ${start.toLocaleDateString('fr-FR')}` }
    }
    case 'monthly': {
      const start = new Date(target.getFullYear(), target.getMonth(), 1)
      const end = new Date(target.getFullYear(), target.getMonth() + 1, 1)
      return { start, end, label: `Mensuel — ${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` }
    }
    case 'yearly': {
      const start = new Date(target.getFullYear(), 0, 1)
      const end = new Date(target.getFullYear() + 1, 0, 1)
      return { start, end, label: `Annuel — ${target.getFullYear()}` }
    }
    default: {
      const start = new Date(target)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { start, end, label: `Journalier — ${start.toLocaleDateString('fr-FR')}` }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily'
    const date = searchParams.get('date') || undefined
    const cabineId = searchParams.get('cabineId') || undefined

    const { start, end, label } = getDateRange(period, date)

    const dateFilter = {
      createdAt: {
        gte: start,
        lt: end,
      },
    }

    const cabineFilter = cabineId ? { cabineId } : {}

    // ---- TRANSACTIONS (unified) ----
    const allTransactions = await db.transaction.findMany({
      where: {
        ...dateFilter,
        ...cabineFilter,
      },
      orderBy: { createdAt: 'desc' },
    })

    // ---- RECHARGES (standalone, not from Transaction flow) ----
    const recharges = await db.recharge.findMany({
      where: {
        ...dateFilter,
        ...cabineFilter,
      },
    })

    // ---- SUBSCRIPTIONS (standalone) ----
    const subscriptions = await db.subscription.findMany({
      where: {
        ...dateFilter,
        ...cabineFilter,
      },
    })

    // ==========================================
    // AGGREGATION
    // ==========================================

    const rechargesFromTx = allTransactions.filter(t => t.type === 'RECHARGE')
    const subsFromTx = allTransactions.filter(t => t.type === 'SUBSCRIPTION')
    const cardSalesFromTx = allTransactions.filter(t => t.type === 'PHYSICAL_CARD')

    // Include standalone recharges/subscriptions that have no linked transaction
    const standaloneRecharges = recharges.filter(r =>
      !allTransactions.some(t => t.rechargeId === r.id)
    )
    const standaloneSubscriptions = subscriptions.filter(s =>
      !allTransactions.some(t => t.subscriptionId === s.id)
    )

    const allRecharges = [...rechargesFromTx, ...standaloneRecharges.map(r => ({
      ...r,
      type: 'RECHARGE' as const,
      paymentMethod: 'UNKNOWN',
      reference: null as string | null,
      cardName: null as string | null,
      cardId: null as string | null,
    }))]
    const allSubs = [...subsFromTx, ...standaloneSubscriptions.map(s => ({
      ...s,
      type: 'SUBSCRIPTION' as const,
      paymentMethod: 'UNKNOWN',
      reference: null as string | null,
      cardName: null as string | null,
      cardId: null as string | null,
    }))]

    // ---- Summary stats ----
    const totalOperations = allRecharges.length + allSubs.length + cardSalesFromTx.length
    const totalAmount = allRecharges.reduce((s, t) => s + t.amount, 0)
      + allSubs.reduce((s, t) => s + t.amount, 0)
      + cardSalesFromTx.reduce((s, t) => s + t.amount, 0)
    const totalCommission = allRecharges.reduce((s, t) => s + t.commission, 0)
      + allSubs.reduce((s, t) => s + t.commission, 0)
      + cardSalesFromTx.reduce((s, t) => s + t.commission, 0)

    const completedOps = [
      ...allRecharges.filter(t => t.status === 'COMPLETED'),
      ...allSubs.filter(t => t.status === 'COMPLETED'),
      ...cardSalesFromTx.filter(t => t.status === 'COMPLETED'),
    ]
    const completedAmount = completedOps.reduce((s, t) => s + t.amount, 0)
    const completedCommission = completedOps.reduce((s, t) => s + t.commission, 0)

    // ---- By type breakdown ----
    const byType = {
      RECHARGE: {
        count: allRecharges.length,
        amount: allRecharges.reduce((s, t) => s + t.amount, 0),
        commission: allRecharges.reduce((s, t) => s + t.commission, 0),
        completed: allRecharges.filter(t => t.status === 'COMPLETED').length,
        completedAmount: allRecharges.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
      },
      SUBSCRIPTION: {
        count: allSubs.length,
        amount: allSubs.reduce((s, t) => s + t.amount, 0),
        commission: allSubs.reduce((s, t) => s + t.commission, 0),
        completed: allSubs.filter(t => t.status === 'COMPLETED').length,
        completedAmount: allSubs.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
      },
      PHYSICAL_CARD: {
        count: cardSalesFromTx.length,
        amount: cardSalesFromTx.reduce((s, t) => s + t.amount, 0),
        commission: cardSalesFromTx.reduce((s, t) => s + t.commission, 0),
        completed: cardSalesFromTx.filter(t => t.status === 'COMPLETED').length,
        completedAmount: cardSalesFromTx.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
      },
    }

    // ---- By operator breakdown ----
    const allOpsForOperator = [
      ...allRecharges.map(t => ({ operator: t.operator, amount: t.amount, status: t.status })),
      ...allSubs.map(t => ({ operator: t.operator, amount: t.amount, status: t.status })),
      ...cardSalesFromTx.map(t => ({ operator: t.operator, amount: t.amount, status: t.status })),
    ]
    const operatorMap = new Map<string, { count: number; amount: number; completed: number }>()
    for (const op of allOpsForOperator) {
      const existing = operatorMap.get(op.operator) || { count: 0, amount: 0, completed: 0 }
      existing.count++
      existing.amount += op.amount
      if (op.status === 'COMPLETED') existing.completed++
      operatorMap.set(op.operator, existing)
    }
    const byOperator = Object.fromEntries(operatorMap)

    // ---- By payment method breakdown ----
    const paymentMethodMap = new Map<string, { count: number; amount: number }>()
    for (const tx of allTransactions) {
      const existing = paymentMethodMap.get(tx.paymentMethod) || { count: 0, amount: 0 }
      existing.count++
      existing.amount += tx.amount
      paymentMethodMap.set(tx.paymentMethod, existing)
    }
    const byPaymentMethod = Object.fromEntries(paymentMethodMap)

    // ---- By status breakdown ----
    const allStatuses = [
      ...allRecharges.map(t => t.status),
      ...allSubs.map(t => t.status),
      ...cardSalesFromTx.map(t => t.status),
    ]
    const statusMap = new Map<string, number>()
    for (const s of allStatuses) {
      statusMap.set(s, (statusMap.get(s) || 0) + 1)
    }
    const byStatus = Object.fromEntries(statusMap)

    // ---- Daily breakdown within the period (for charts) ----
    const dailyBreakdown: { date: string; count: number; amount: number; commission: number }[] = []
    const current = new Date(start)
    while (current < end) {
      const dayStart = new Date(current)
      const dayEnd = new Date(current)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayOps = [
        ...allRecharges.filter(t => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) < dayEnd),
        ...allSubs.filter(t => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) < dayEnd),
        ...cardSalesFromTx.filter(t => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) < dayEnd),
      ]

      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayOps.length,
        amount: dayOps.reduce((s, t) => s + t.amount, 0),
        commission: dayOps.reduce((s, t) => s + t.commission, 0),
      })

      current.setDate(current.getDate() + 1)
    }

    // ---- Physical card sales detail ----
    const cardSalesDetail = cardSalesFromTx.map(t => ({
      id: t.id,
      reference: t.reference,
      cardName: t.cardName || 'Carte physique',
      cardId: t.cardId,
      operator: t.operator,
      amount: t.amount,
      paymentMethod: t.paymentMethod,
      status: t.status,
      createdAt: t.createdAt,
    }))

    // ---- Top selling cards ----
    const cardSalesMap = new Map<string, { name: string; count: number; amount: number }>()
    for (const sale of cardSalesFromTx) {
      const key = sale.cardName || 'Inconnu'
      const existing = cardSalesMap.get(key) || { name: key, count: 0, amount: 0 }
      existing.count++
      existing.amount += sale.amount
      cardSalesMap.set(key, existing)
    }
    const topSellingCards = Array.from(cardSalesMap.values()).sort((a, b) => b.amount - a.amount)

    // ---- Previous period comparison ----
    const periodDuration = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - periodDuration)
    const prevEnd = new Date(start)

    const prevTransactions = await db.transaction.findMany({
      where: {
        createdAt: { gte: prevStart, lt: prevEnd },
        ...cabineFilter,
      },
    })
    const prevRecharges = await db.recharge.findMany({
      where: {
        createdAt: { gte: prevStart, lt: prevEnd },
        ...cabineFilter,
      },
    })
    const prevSubscriptions = await db.subscription.findMany({
      where: {
        createdAt: { gte: prevStart, lt: prevEnd },
        ...cabineFilter,
      },
    })

    const prevTotalOps = prevTransactions.length
      + prevRecharges.filter(r => !prevTransactions.some(t => t.rechargeId === r.id)).length
      + prevSubscriptions.filter(s => !prevTransactions.some(t => t.subscriptionId === s.id)).length
    const prevTotalAmount = prevTransactions.reduce((s, t) => s + t.amount, 0)
      + prevRecharges.filter(r => !prevTransactions.some(t => t.rechargeId === r.id)).reduce((s, t) => s + t.amount, 0)
      + prevSubscriptions.filter(s => !prevTransactions.some(t => t.subscriptionId === s.id)).reduce((s, t) => s + t.amount, 0)

    const opsVariation = prevTotalOps > 0 ? Math.round(((totalOperations - prevTotalOps) / prevTotalOps) * 100) : 0
    const amountVariation = prevTotalAmount > 0 ? Math.round(((totalAmount - prevTotalAmount) / prevTotalAmount) * 100) : 0

    // ---- Loyalty stats ----
    const totalClients = await db.user.count({
      where: { role: { in: ['CLIENT', 'LOYAL_CLIENT'] } },
    })
    const loyalClients = await db.user.count({
      where: { loyaltyTier: { not: 'NONE' } },
    })
    const activePromoCodes = await db.promoCode.count({ where: { status: 'ACTIVE' } })
    const usedPromoCodes = await db.promoCode.count({ where: { status: 'USED' } })
    const totalPromoValue = await db.promoCode.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { amount: true },
    })
    const usedPromoValue = await db.promoCode.aggregate({
      where: { status: 'USED' },
      _sum: { amount: true },
    })
    // New loyal clients in this period
    const newLoyalClients = await db.user.count({
      where: {
        loyaltyUnlockedAt: { gte: start, lt: end },
      },
    })
    // Promo codes used in this period
    const promosUsedInPeriod = await db.promoCode.count({
      where: {
        status: 'USED',
        usedAt: { gte: start, lt: end },
      },
    })

    return NextResponse.json({
      period: label,
      periodType: period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalOperations,
        totalAmount,
        totalCommission,
        completedOperations: completedOps.length,
        completedAmount,
        completedCommission,
        opsVariation,
        amountVariation,
      },
      byType,
      byOperator,
      byPaymentMethod,
      byStatus,
      dailyBreakdown,
      cardSalesDetail,
      topSellingCards,
      loyalty: {
        totalClients,
        loyalClients,
        newLoyalClients,
        activePromoCodes,
        usedPromoCodes,
        totalPromoValue: totalPromoValue._sum.amount || 0,
        usedPromoValue: usedPromoValue._sum.amount || 0,
        promosUsedInPeriod,
      },
      transactions: allTransactions.slice(0, 200).map(t => ({
        id: t.id,
        reference: t.reference,
        phone: t.phone,
        operator: t.operator,
        amount: t.amount,
        paymentMethod: t.paymentMethod,
        type: t.type,
        planName: t.planName,
        cardName: t.cardName,
        status: t.status,
        commission: t.commission,
        createdAt: t.createdAt,
      })),
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
