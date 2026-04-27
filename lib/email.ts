import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'ADA Checker <noreply@ada-checker.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your ADA Checker email address',
    html: `
      <p>Thanks for signing up for ADA Checker.</p>
      <p>Click the link below to verify your email address. The link expires in 24 hours.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  });
}
