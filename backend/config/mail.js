import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/** Expéditeur gratuit Resend — aucun domaine à acheter */
export const RESEND_FREE_FROM = 'FinSpirit <onboarding@resend.dev>';

export function getMailCredentials() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  return { user, pass };
}

export function getMailProvider() {
  if (process.env.RESEND_API_KEY?.trim()) return 'resend';
  const { user, pass } = getMailCredentials();
  if (user && pass) return 'smtp';
  return 'none';
}

export function isMailConfigured() {
  return getMailProvider() !== 'none';
}

function buildSmtpTransporter(port) {
  const { user, pass } = getMailCredentials();
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: { minVersion: 'TLSv1.2' },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
}

const smtpTransporter587 = buildSmtpTransporter(587);
const smtpTransporter465 = buildSmtpTransporter(465);

async function sendViaSmtp({ from, to, subject, html }) {
  const { user, pass } = getMailCredentials();
  if (!user || !pass) {
    throw new Error('Configuration e-mail manquante : EMAIL_USER ou EMAIL_PASS n\'est pas défini sur le serveur.');
  }

  const mailOptions = {
    from: from || `"FinSpirit" <${user}>`,
    to,
    subject,
    html,
  };

  try {
    return await smtpTransporter587.sendMail(mailOptions);
  } catch (error) {
    const isTimeout = error?.code === 'ETIMEDOUT' || error?.code === 'ESOCKET'
      || /timeout|timed out/i.test(error?.message || '');
    if (!isTimeout) throw error;
    console.warn('SMTP port 587 indisponible, nouvel essai sur le port 465...');
    return smtpTransporter465.sendMail(mailOptions);
  }
}

export function isResendFreeMode() {
  return process.env.RESEND_PAID_DOMAIN !== 'true';
}

export function resolveFromAddress(explicitFrom) {
  if (getMailProvider() === 'resend') {
    // Mode gratuit par défaut — aucun domaine à acheter
    if (isResendFreeMode()) {
      return RESEND_FREE_FROM;
    }
    return process.env.RESEND_FROM?.trim() || RESEND_FREE_FROM;
  }

  const { user } = getMailCredentials();
  return explicitFrom || (user ? `"FinSpirit" <${user}>` : undefined);
}

async function sendViaResend({ from, to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY manquant sur le serveur.');
  }

  const resolvedFrom = resolveFromAddress(from);
  if (!resolvedFrom) {
    throw new Error(`RESEND_FROM manquant. Utilisez : ${RESEND_FREE_FROM}`);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resolvedFrom,
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.message || data.error || `Erreur Resend (${response.status})`;
    throw new Error(detail);
  }

  return data;
}

export async function verifyMailConnection() {
  const provider = getMailProvider();

  if (provider === 'none') {
    console.warn('⚠️ Aucun service e-mail configuré (RESEND_API_KEY ou EMAIL_USER/EMAIL_PASS)');
    return false;
  }

  if (provider === 'resend') {
    const from = resolveFromAddress();
    console.log(`✓ Service e-mail configuré (Resend gratuit — expéditeur : ${from})`);
    if (from.includes('@resend.dev')) {
      console.log('  ℹ Mode sandbox : envoi possible vers l\'e-mail de votre compte Resend uniquement.');
    }
    return true;
  }

  const { user } = getMailCredentials();
  try {
    await smtpTransporter587.verify();
    console.log(`✓ Service e-mail configuré (SMTP Gmail — ${user})`);
    return true;
  } catch (error) {
    console.error('⚠️ Connexion SMTP échouée:', error.message);
    console.warn('   → En production, ajoutez RESEND_API_KEY (SMTP souvent bloqué par l\'hébergeur).');
    return false;
  }
}

export function formatMailError(error) {
  const message = error?.message || '';
  const code = error?.code || '';

  if (code === 'ETIMEDOUT' || code === 'ESOCKET' || /timeout|timed out/i.test(message)) {
    return 'Envoi e-mail impossible : le serveur de production bloque probablement SMTP. Configurez RESEND_API_KEY sur l\'hébergeur du backend.';
  }
  if (code === 'EAUTH' || /invalid login|authentication/i.test(message)) {
    return 'Authentification e-mail refusée. Vérifiez EMAIL_USER et le mot de passe d\'application Gmail.';
  }
  if (/Configuration e-mail manquante|RESEND_API_KEY manquant|RESEND_FROM manquant/.test(message)) {
    return message;
  }
  if (/only send.*own|testing emails|verify a domain|recipient.*not allowed/i.test(message)) {
    return 'Mode gratuit Resend : l\'e-mail ne peut être envoyé qu\'à l\'adresse liée à votre compte Resend. Utilisez la même adresse pour vous inscrire sur FinSpirit.';
  }
  if (/domain.*not verified|not verified|verify your domain/i.test(message)) {
    return 'Domaine non vérifié sur Resend. En mode gratuit, utilisez RESEND_FROM=FinSpirit <onboarding@resend.dev>';
  }
  if (/invalid from|from address/i.test(message)) {
    return `Adresse expéditeur invalide. Mode gratuit : ${RESEND_FREE_FROM}`;
  }

  return message || 'Erreur lors de l\'envoi de l\'e-mail';
}

export async function sendEmail({ from, to, subject, html }) {
  const resolvedFrom = resolveFromAddress(from);

  if (getMailProvider() === 'resend') {
    return sendViaResend({ from: resolvedFrom, to, subject, html });
  }

  return sendViaSmtp({ from: resolvedFrom, to, subject, html });
}

export default smtpTransporter587;
