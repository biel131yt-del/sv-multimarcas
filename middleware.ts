/**
 * Vercel Routing Middleware — Protecao do painel administrativo
 *
 * Intercepta requisicoes de /admin/* antes do cache e exige um cookie
 * de sessao valido. A senha NUNCA vai para o cliente: ela e conferida
 * no servidor (api/login.js) e o middleware so valida a assinatura.
 *
 * Variaveis de ambiente:
 *   ADMIN_PASSWORD  senha de acesso ao painel (obrigatoria)
 *   ADMIN_SECRET    segredo usado para assinar o cookie (opcional,
 *                   cai para ADMIN_PASSWORD se nao definida)
 *
 * Sem ADMIN_PASSWORD o painel fica BLOQUEADO (falha segura).
 */

export const config = {
  matcher: ['/admin/:path*', '/admin'],
  runtime: 'nodejs',
};

const COOKIE = 'sv_admin';
const VALIDADE = 60 * 60 * 12; // 12 horas

function lerCookie(headers, nome) {
  const raw = headers.get('cookie') || '';
  for (const parte of raw.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nome) return decodeURIComponent(v.join('='));
  }
  return null;
}

function base64url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decodifica base64url (aceita string sem padding). */
function base64urlDecode(str) {
  const normalizado = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalizado.length % 4 ? '='.repeat(4 - (normalizado.length % 4)) : '';
  return atob(normalizado + padding);
}

async function assinar(payload, segredo) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return base64url(sig);
}

async function tokenValido(token) {
  if (!token) return false;
  const partes = token.split('.');
  if (partes.length !== 2) return false;

  const [payloadB64, assinatura] = partes;
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64));
  } catch {
    return false;
  }

  if (!payload || !payload.exp || payload.exp < Date.now()) {
    return false;
  }

  const segredo = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!segredo) return false;

  const esperado = await assinar(payloadB64, segredo);

  if (esperado.length !== assinatura.length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) {
    diff |= esperado.charCodeAt(i) ^ assinatura.charCodeAt(i);
  }
  return diff === 0;
}

export default async function middleware(request) {
  const url = new URL(request.url);

  const temSenha = !!(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET);
  if (!temSenha) {
    // Falha segura: sem senha configurada, o painel nao abre.
    return new Response(
      '<!doctype html><html lang="pt-BR"><meta charset="utf-8">' +
      '<title>Acesso nao configurado</title>' +
      '<body style="background:#0B0B0D;color:#fff;font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">' +
      '<div><h1 style="font-size:22px;margin:0 0 12px">Painel nao configurado</h1>' +
      '<p style="color:#A8ADB5;margin:0">Defina a variavel ADMIN_PASSWORD nas configuracoes do projeto.</p></div>' +
      '</body></html>',
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  const token = lerCookie(request.headers, COOKIE);
  if (await tokenValido(token)) {
    return; // segue para o painel
  }

  const destino = new URL('/login', url.origin);
  // Mantem a query string: sem isso, o functoolsario perde o veiculo que
  // estava editando (ex.: /admin/veiculo-editar?id=3 virava /admin/veiculo-editar).
  destino.searchParams.set('next', url.pathname + url.search);
  return Response.redirect(destino.toString(), 302);
}
