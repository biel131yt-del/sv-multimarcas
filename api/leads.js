/**
 * SV Multimarcas — API de contatos (leads)
 *
 * POST /api/leads  -> cria um contato
 *   Body: { nome, telefone, email?, veiculo?, mensagem?, tipo, origem? }
 * GET  /api/leads  -> lista os contatos (painel admin)
 *
 * Grava no Neon (PostgreSQL). Sem DATABASE_URL, funciona em modo
 * demonstracao: valida e registra no log — o cliente ainda chega
 * pelo WhatsApp, aberto pelo proprio site.
 */

import { temBanco, lerLeads, salvarLead } from './_db.js';

const TIPOS_VALIDOS = ['interest', 'sell', 'trade', 'financing'];

function sanitizar(str, max = 500) {
  if (str == null) return null;
  const limpo = String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim();
  return limpo ? limpo.slice(0, max) : null;
}

function somenteDigitos(str) {
  return String(str || '').replace(/\D/g, '');
}

function emailValido(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  /* -------------------------------------------------------------
     GET — lista contatos
     ------------------------------------------------------------- */
  if (req.method === 'GET') {
    if (!temBanco()) {
      return res.status(200).json({ leads: [], mensagem: 'Banco de dados nao configurado.' });
    }
    try {
      const leads = await lerLeads();
      return res.status(200).json({ leads });
    } catch (e) {
      console.error('[leads] erro ao listar:', e.message);
      return res.status(200).json({ leads: [], mensagem: 'Nao foi possivel ler os contatos.' });
    }
  }

  /* -------------------------------------------------------------
     POST — cria contato
     ------------------------------------------------------------- */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON invalido' }); }
  }
  body = body || {};

  // Validacao
  const nome = sanitizar(body.nome, 120);
  const telefone = sanitizar(body.telefone, 30);
  const email = sanitizar(body.email, 180);
  const veiculo = sanitizar(body.veiculo, 200);
  const mensagem = sanitizar(body.mensagem, 1500);
  const origem = sanitizar(body.origem, 120);
  const tipo = TIPOS_VALIDOS.includes(body.tipo) ? body.tipo : 'interest';

  const erros = [];
  if (!nome || nome.length < 3) erros.push('Nome invalido.');
  if (!telefone || somenteDigitos(telefone).length < 10) erros.push('Telefone invalido.');
  if (!emailValido(email)) erros.push('E-mail invalido.');

  if (erros.length) {
    return res.status(400).json({ error: erros.join(' '), campos: erros });
  }

  const registro = {
    name: nome,
    phone: telefone,
    email: email || null,
    vehicle: veiculo || null,
    message: mensagem || null,
    type: tipo,
    source: origem || 'site'
  };

  if (temBanco()) {
    try {
      await salvarLead(registro);
      return res.status(201).json({ ok: true, salvo: true });
    } catch (e) {
      console.error('[leads] erro no banco:', e.message);
      return res.status(502).json({ error: 'Falha ao registrar contato.' });
    }
  }

  // Modo demonstracao
  console.log('[leads] Contato recebido (sem persistencia):', registro);
  return res.status(200).json({ ok: true, salvo: false });
}
