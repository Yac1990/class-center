import nodemailer from 'nodemailer'

const ADMIN_EMAIL = 'supportclasscenter@gmail.com'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
})

export async function sendNotificationEmail(params: {
  type: 'RECHARGE' | 'SOUSCRIPTION'
  clientName: string
  phone: string
  amount: number
  operator: string
  planName?: string
}) {
  const { type, clientName, phone, amount, operator, planName } = params

  const subject = type === 'RECHARGE'
    ? `🔋 Nouvelle demande de recharge - ${formatCurrency(amount)} FCFA`
    : `📱 Nouvelle demande de souscription - ${planName || ''}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563EB, #1d4ed8); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">CLASS CENTER</h1>
        <p style="color: #93c5fd; margin: 8px 0 0; font-size: 14px;">Nouvelle demande ${type === 'RECHARGE' ? 'de recharge' : 'de souscription'}</p>
      </div>
      <div style="padding: 24px; color: #e5e2e1;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #a89080; font-size: 13px;">Type</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: bold; text-align: right;">${type === 'RECHARGE' ? '🔋 Recharge' : '📱 Souscription'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #a89080; font-size: 13px;">Client</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: bold; text-align: right;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #a89080; font-size: 13px;">Numéro</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: bold; text-align: right;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #a89080; font-size: 13px;">Opérateur</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: bold; text-align: right;">${operator}</td>
          </tr>
          ${planName ? `<tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #a89080; font-size: 13px;">Forfait</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: bold; text-align: right;">${planName}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 12px 0; color: #a89080; font-size: 13px;">Montant</td>
            <td style="padding: 12px 0; font-weight: bold; text-align: right; font-size: 18px; color: #22c55e;">${formatCurrency(amount)} FCFA</td>
          </tr>
        </table>
        <div style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; text-align: center;">
          <p style="color: #a89080; font-size: 13px; margin: 0;">Connectez-vous au dashboard admin pour valider cette demande</p>
        </div>
      </div>
    </div>
  `

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email not configured - would send to:', ADMIN_EMAIL, subject)
      return { sent: false, reason: 'EMAIL_USER/EMAIL_PASS not configured' }
    }

    const info = await transporter.sendMail({
      from: `"CLASS CENTER" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    })

    console.log('📧 Email sent:', info.messageId)
    return { sent: true, messageId: info.messageId }
  } catch (error) {
    console.error('📧 Email error:', error)
    return { sent: false, error: String(error) }
  }
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR')
}
