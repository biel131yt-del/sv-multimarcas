/**
 * Teste local do fluxo de autenticacao: gera o token (igual api/login.js)
 * e valida (igual middleware.ts). Serve para isolar bugs de codigo
 * de problemas de ambiente (runtime, env vars).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const SENHA = 'senha-de-teste-123';
const SEGREDO = 'segredo-de-teste-abc';

const VALIDADE = 60 * 60 * 12;

/* ---------- igual api/login.js ---------- */
function assinar(payload, segredo) {
  return createHmac('sha256', segredo).update(payload).digest('base64url');
}

function gerarToken() {
  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + VALIDADE * 1000,
    iat: Date.now()
  })).toString('base64url');
  return `${payload}.${assinar(payload, SEGREDO)}`;
}

/* ---------- igual middleware.ts ---------- */
function base64url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  const normalizado = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalizado.length % 4 ? '='.repeat(4 - (normalizado.length % 4)) : '';
  return atob(normalizado + padding);
}

async function assinarEdge(payload, segredo) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return base64url(sig);
}

async function tokenValido(token) {
  if (!token) return { ok: false, motivo: 'sem token' };
  const partes = token.split('.');
  if (partes.length !== 2) return { ok: false, motivo: 'formato invalido' };

  const [payloadB64, assinatura] = partes;
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64));
  } catch (e) {
    return { ok: false, motivo: 'decode falhou: ' + e.message };
  }

  if (!payload || !payload.exp || payload.exp < Date.now()) {
    return { ok: false, motivo: 'expirado' };
  }

  const esperado = await assinarEdge(payloadB64, SEGREDO);
  if (esperado.length !== assinatura.length) {
    return { ok: false, motivo: `tamanho difere: ${esperado.length} vs ${assinatura.length}` };
  }
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) {
    diff |= esperado.charCodeAt(i) ^ assinatura.charCodeAt(i);
  }
  return { ok: diff === 0, motivo: diff === 0 ? 'valido' : 'assinatura difere' };
}

const token = gerarToken();
console.log('token gerado:', token.slice(0, 50) + '...');
const r = await tokenValido(token);
console.log('validacao local:', r);
console.log(r.ok ? '✅ FLUXO CORRETO' : '❌ FALHA NO CODIGO');
