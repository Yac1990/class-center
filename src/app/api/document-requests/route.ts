import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ==========================================
// DOCUMENT REQUESTS API
// POST (public): clients send their documents for processing
// GET (admin): list all requests
// PUT (admin): update status, send quote, send final document
// ==========================================

const VALID_SERVICE_TYPES = [
  'TRAITEMENT_TEXTE',
  'SAISIE',
  'MISE_EN_PAGE',
  'CORRECTION',
  'CV_LETTRE',
  'MEMOIRE_RAPPORT',
  'DOC_ADMIN',
  'IMPRESSION',
  'NUMERISATION',
  'PHOTOCOPIE',
  'CONCEPTION',
  'AUTRE',
]

const VALID_DELIVERY_MODES = ['DIGITAL', 'PHYSICAL', 'PICKUP']

const VALID_STATUSES = [
  'RECEIVED',
  'IN_PROGRESS',
  'AWAITING_PAYMENT',
  'COMPLETED',
  'DELIVERED',
  'CANCELLED',
]

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Reçu',
  IN_PROGRESS: 'En cours de traitement',
  AWAITING_PAYMENT: 'En attente de paiement',
  COMPLETED: 'Terminé',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
}

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  AWAITING_PAYMENT: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

const SERVICE_LABELS: Record<string, string> = {
  TRAITEMENT_TEXTE: 'Traitement de texte',
  SAISIE: 'Saisie de documents manuscrits',
  MISE_EN_PAGE: 'Mise en page professionnelle',
  CORRECTION: 'Correction de documents',
  CV_LETTRE: 'CV et lettre de motivation',
  MEMOIRE_RAPPORT: 'Mémoire, rapport, thèse',
  DOC_ADMIN: 'Documents administratifs',
  IMPRESSION: 'Impression de documents',
  NUMERISATION: 'Numérisation (scan)',
  PHOTOCOPIE: 'Photocopie',
  CONCEPTION: 'Conception de documents personnalisés',
  AUTRE: 'Autre',
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let random = ''
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `DOC-${random}`
}

async function ensureUniqueTrackingCode(): Promise<string> {
  let code = generateTrackingCode()
  let exists = await db.documentRequest.findUnique({ where: { trackingCode: code } })
  let attempts = 0
  while (exists && attempts < 10) {
    code = generateTrackingCode()
    exists = await db.documentRequest.findUnique({ where: { trackingCode: code } })
    attempts++
  }
  return code
}

// GET /api/document-requests - admin lists all (or filter by status / trackingCode)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const trackingCode = searchParams.get('trackingCode')

    const where: any = {}
    if (status) where.status = status
    if (trackingCode) where.trackingCode = trackingCode

    const requests = await db.documentRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Add labels/colors for the client UI
    const enriched = requests.map((r) => ({
      ...r,
      filesList: safeParseFiles(r.files),
      statusLabel: STATUS_LABELS[r.status] || r.status,
      statusColor: STATUS_COLORS[r.status] || '',
      serviceTypeLabel: SERVICE_LABELS[r.serviceType] || r.serviceType,
      deliveryModeLabel:
        r.deliveryMode === 'DIGITAL'
          ? 'Livraison numérique'
          : r.deliveryMode === 'PHYSICAL'
          ? 'Livraison physique à domicile'
          : 'Retrait dans nos locaux',
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Get document requests error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function safeParseFiles(filesStr: string): any[] {
  try {
    const parsed = JSON.parse(filesStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// POST /api/document-requests - public submission
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const {
      clientName,
      clientPhone,
      clientEmail,
      deliveryAddress,
      serviceType,
      serviceTypeOther,
      deliveryMode,
      description,
      files,
    } = data

    if (!clientName || typeof clientName !== 'string' || !clientName.trim()) {
      return NextResponse.json({ error: 'Le nom du client est requis' }, { status: 400 })
    }
    if (!clientPhone || typeof clientPhone !== 'string' || !clientPhone.trim()) {
      return NextResponse.json({ error: 'Le numéro de téléphone est requis' }, { status: 400 })
    }
    if (!serviceType || !VALID_SERVICE_TYPES.includes(serviceType)) {
      return NextResponse.json({ error: 'Type de service invalide' }, { status: 400 })
    }
    if (!deliveryMode || !VALID_DELIVERY_MODES.includes(deliveryMode)) {
      return NextResponse.json({ error: 'Mode de livraison invalide' }, { status: 400 })
    }

    // If "AUTRE", require serviceTypeOther
    if (serviceType === 'AUTRE' && (!serviceTypeOther || !serviceTypeOther.trim())) {
      return NextResponse.json(
        { error: 'Veuillez préciser le type de service (champ Autre)' },
        { status: 400 }
      )
    }

    // Validate files array (max 10 files, each must have a url)
    const filesList = Array.isArray(files) ? files : safeParseFiles(files)
    if (filesList.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 fichiers par demande' }, { status: 400 })
    }

    const trackingCode = await ensureUniqueTrackingCode()

    const created = await db.documentRequest.create({
      data: {
        trackingCode,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: (clientEmail || '').trim(),
        deliveryAddress: (deliveryAddress || '').trim(),
        serviceType,
        serviceTypeOther: (serviceTypeOther || '').trim(),
        deliveryMode,
        description: (description || '').trim(),
        files: JSON.stringify(filesList),
        status: 'RECEIVED',
      },
    })

    // Auto-capture email for promotional purposes
    try {
      if (clientEmail && clientEmail.includes('@')) {
        await db.promotionalEmail.upsert({
          where: { email: clientEmail },
          update: { name: clientName.trim(), source: 'FLASH_ORDER', active: true },
          create: {
            email: clientEmail,
            name: clientName.trim(),
            source: 'FLASH_ORDER',
          },
        })
      } else if (clientPhone) {
        await db.promotionalEmail.upsert({
          where: { email: `${clientPhone}@doc.classcenter.ci` },
          update: { name: clientName.trim(), source: 'FLASH_ORDER', active: true },
          create: {
            email: `${clientPhone}@doc.classcenter.ci`,
            name: clientName.trim(),
            source: 'FLASH_ORDER',
          },
        })
      }
    } catch (emailError) {
      console.error('Email capture error:', emailError)
    }

    return NextResponse.json(
      {
        ...created,
        filesList,
        statusLabel: STATUS_LABELS[created.status],
        statusColor: STATUS_COLORS[created.status],
        serviceTypeLabel: SERVICE_LABELS[created.serviceType] || created.serviceType,
        deliveryModeLabel:
          created.deliveryMode === 'DIGITAL'
            ? 'Livraison numérique'
            : created.deliveryMode === 'PHYSICAL'
            ? 'Livraison physique à domicile'
            : 'Retrait dans nos locaux',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create document request error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/document-requests - admin updates a request
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const existing = await db.documentRequest.findUnique({ where: { id: data.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    const updateData: any = {}
    if (data.status !== undefined) {
      if (!VALID_STATUSES.includes(data.status)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
      }
      updateData.status = data.status
    }
    if (data.quoteAmount !== undefined) {
      const amt = parseInt(data.quoteAmount, 10)
      updateData.quoteAmount = isNaN(amt) ? null : Math.max(0, amt)
    }
    if (data.quoteDelay !== undefined) updateData.quoteDelay = String(data.quoteDelay).slice(0, 200)
    if (data.quoteNote !== undefined) updateData.quoteNote = String(data.quoteNote)
    if (data.finalDocumentUrl !== undefined) {
      updateData.finalDocumentUrl = String(data.finalDocumentUrl)
    }
    if (data.adminNote !== undefined) updateData.adminNote = String(data.adminNote)

    const updated = await db.documentRequest.update({
      where: { id: data.id },
      data: updateData,
    })

    return NextResponse.json({
      ...updated,
      filesList: safeParseFiles(updated.files),
      statusLabel: STATUS_LABELS[updated.status],
      statusColor: STATUS_COLORS[updated.status],
      serviceTypeLabel: SERVICE_LABELS[updated.serviceType] || updated.serviceType,
      deliveryModeLabel:
        updated.deliveryMode === 'DIGITAL'
          ? 'Livraison numérique'
          : updated.deliveryMode === 'PHYSICAL'
          ? 'Livraison physique à domicile'
          : 'Retrait dans nos locaux',
    })
  } catch (error) {
    console.error('Update document request error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/document-requests?id=... - admin deletes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await db.documentRequest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete document request error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
