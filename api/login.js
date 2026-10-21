/**
 * API de login do painel administrativo
 *
 * POST /api/login   { senha }  -> valida e define o cookie de sessao
 * POST /api/logout           -> limpa o cookie
 *
 * A senha e conferida contra a variavel de ambiente ADMIN_PASSWORD.
 * Ela nunca trafega para o navegador depois do envio.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'sv_admin';
const VALIDADE = 60 * 60 * 12; // 12 horas

function assinar(payload, segredo) {
  return createHmac('sha256', segredo).update(payload).digest('base64url');
}

function comparacaoSegura(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function lerCookie(req) {
  const raw = req.headers.cookie || '';
  for (const parte of raw.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const senhaAdmin = process.env.ADMIN_PASSWORD;
  const segredo = process.env.ADMIN_SECRET || senhaAdmin;

  if (!senhaAdmin) {
    return res.status(503).json({
      error: 'Painel nao configurado. Defina ADMIN_PASSWORD no projeto.'
    });
  }

  /* ---------------- LOGOUT ---------------- */
  if (req.url.includes('/api/logout')) {
    res.setHeader('Set-Cookie',
      `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
    return res.status(200).json({ ok: true });
  }

  /* ---------------- LOGIN ---------------- */
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const senha = String(body.senha || '');
  if (!senha) {
    return res.status(400).json({ error: 'Informe a senha.' });
  }

  if (!comparacaoSegura(senha, senhaAdmin)) {
    // pequeno atraso para dificultar forca bruta
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + VALIDADE * 1000,
    iat: Date.now()
  })).toString('base64url');

  const token = `${payload}.${assinar(payload, segredo)}`;

  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; Path=/; Max-Age=${VALIDADE}; HttpOnly; Secure; SameSite=Lax`);
  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).json({ ok: true });
}
