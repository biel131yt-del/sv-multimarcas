/**
 * SV Multimarcas - API de Leads (Vercel Serverless Function)
 *
 * POST /api/leads  -> cria um lead
 *   Body: { nome, telefone, email?, veiculo?, mensagem?, tipo, origem? }
 *
 * GET  /api/leads  -> lista os leads (painel admin)
 *
 * Salva no Supabase quando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão
 * configurados. Sem credenciais, funciona em modo demonstracao: valida e
 * responde OK (o lead ainda chega pelo WhatsApp, aberto pelo site).
 */

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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  /* -------------------------------------------------------------
     GET - lista de leads (painel admin)
     ------------------------------------------------------------- */
  if (req.method === 'GET') {
    if (!supabaseUrl || !serviceKey) {
      return res.status(200).json({ leads: [], mensagem: 'Banco de dados nao configurado.' });
    }

    try {
      const resposta = await fetch(
        `${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc&limit=200`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`
          }
        }
      );

      if (!resposta.ok) {
        const detalhe = await resposta.text();
        console.error('[leads] Erro ao listar:', resposta.status, detalhe);
        return res.status(502).json({ error: 'Falha ao buscar leads.' });
      }

      const leads = await resposta.json();
      return res.status(200).json({ leads });
    } catch (err) {
      console.error('[leads] Excecao ao listar:', err);
      return res.status(502).json({ error: 'Falha ao buscar leads.' });
    }
  }

  /* -------------------------------------------------------------
     POST - cria lead
     ------------------------------------------------------------- */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'JSON invalido' });
    }
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
    source: origem || 'site',
    created_at: new Date().toISOString()
  };

  // Persistencia (Supabase)
  if (supabaseUrl && serviceKey) {
    try {
      const resposta = await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(registro)
      });

      if (!resposta.ok) {
        const detalhe = await resposta.text();
        console.error('[leads] Erro Supabase:', resposta.status, detalhe);
        return res.status(502).json({ error: 'Falha ao registrar lead.' });
      }

      return res.status(201).json({ ok: true, salvo: true });
    } catch (err) {
      console.error('[leads] Excecao Supabase:', err);
      return res.status(502).json({ error: 'Falha ao registrar lead.' });
    }
  }

  // Sem credenciais: registra no log e responde OK
  console.log('[leads] Lead recebido (sem persistencia):', registro);
  return res.status(200).json({ ok: true, salvo: false });
}
