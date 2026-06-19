import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.EMAIL_FROM || 'orders@yourdomain.com'
const fromName = process.env.EMAIL_FROM_NAME || 'AI Digital Products'

export const resend = apiKey ? new Resend(apiKey) : null
export const isEmailConfigured = () => !!resend

export interface SendOrderEmailParams {
  to: string
  customerName?: string
  productName: string
  productType: string
  downloadUrl?: string
  orderId: string
  amount: number
}

export async function sendOrderConfirmationEmail(params: SendOrderEmailParams) {
  if (!resend) return { success: false, demo: true }

  const { to, customerName, productName, productType, downloadUrl, orderId, amount } = params

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Your Purchase! 🎉</h1>
      <p style="color: #a5b4fc; margin: 8px 0 0;">Order #${orderId.slice(-8).toUpperCase()}</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px;">Hi ${customerName || 'there'},</p>
      <p style="color: #374151;">Your order is confirmed. Here's what you purchased:</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="font-weight: 600; color: #111827; margin: 0; font-size: 16px;">${productName}</p>
            <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px; text-transform: capitalize;">${productType} • Digital Download</p>
          </div>
          <p style="font-weight: 700; color: #059669; font-size: 18px; margin: 0;">$${amount.toFixed(2)}</p>
        </div>
      </div>
      ${downloadUrl ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${downloadUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          ⬇️ Download Your Product
        </a>
        <p style="color: #6b7280; font-size: 13px; margin-top: 12px;">Link expires in 48 hours</p>
      </div>
      ` : `
      <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #fcd34d;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">⏳ Your download link is being prepared and will be emailed within 24 hours.</p>
      </div>
      `}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #6b7280; font-size: 13px; margin: 0;">Questions? Reply to this email or visit our store. Thank you for supporting AI-powered tools!</p>
    </div>
    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">${fromName} • Instant Digital Delivery</p>
    </div>
  </div>
</body>
</html>`

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: `Your purchase: ${productName}`,
    html,
  })

  if (error) return { success: false, error }
  return { success: true, id: data?.id }
}

export interface SendMarketingEmailParams {
  to: string | string[]
  subject: string
  htmlBody: string
  previewText?: string
}

export async function sendMarketingEmail(params: SendMarketingEmailParams) {
  if (!resend) return { success: false, demo: true }

  const { to, subject, htmlBody, previewText } = params
  const recipients = Array.isArray(to) ? to : [to]

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: recipients,
    subject,
    html: `<div style="display:none;max-height:0;overflow:hidden;">${previewText || ''}</div>${htmlBody}`,
  })

  if (error) return { success: false, error }
  return { success: true, id: data?.id }
}
