import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL!

export async function sendQueryNotification({
  userName,
  userPhone,
  category,
  message,
}: {
  userName: string
  userPhone: string
  category: string
  message: string
}) {
  await resend.emails.send({
    from: 'HealEasy <onboarding@resend.dev>',
    to: ADMIN_EMAIL,
    subject: `New Query [${category}] from ${userName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">New Support Query — HealEasy</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 140px;">Name:</td>
            <td style="padding: 8px;">${userName}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold;">Phone:</td>
            <td style="padding: 8px;">${userPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Category:</td>
            <td style="padding: 8px;">${category}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Message:</td>
            <td style="padding: 8px;">${message}</td>
          </tr>
        </table>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">Sent from HealEasy Cohort Dashboard</p>
      </div>
    `,
  })
}
