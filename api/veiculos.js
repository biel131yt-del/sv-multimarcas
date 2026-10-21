/**
 * SV Multimarcas — Estoque publicado
 *
 * GET  /api/veiculos  -> lista o estoque (Supabase > GitHub > seed local)
 * POST /api/veiculos  -> grava o estoque (Supabase > fallback GitHub)
 *
 * A fonte de verdade e o Supabase quando configurado. Sem ele, o
 * sistema usa a Contents API do GitHub (mesmo fluxo, outra origem).
 */

import { salvarArquivo, temToken, erro } from './_github.js';
import {
  temSupabase,
  lerVeiculos,
  salvarVeiculo,
  removerVeiculo
} from './_supabase.js';

const CAMINHO = 'data/vehicles.js';

const CABECALHO = `/**
 * SV Multimarcas — Fonte única de dados do estoque
 *
 * Este é o ÚNICO lugar onde os veículos são cadastrados.
 * O site público (index.html, veiculo.html) e o painel admin leem daqui.
 *
 * FOTOS — cada veículo tem 3 ângulos mínimos:
 *   frente   → capa do anúncio (card no estoque + topo da página do veículo)
 *   interior → 2ª foto da galeria
 *   traseira → 3ª foto da galeria
 *   extras   → fotos adicionais (opcional)
 *
 * Gerado pelo painel administrativo.
 */
`;

function cabecalho() {
  return CABECALHO;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  /* -------------------------------------------------------------
     GET — lista o estoque
     ------------------------------------------------------------- */
  if (req.method === 'GET') {
    const doSupabase = await lerVeiculos();
    const origem = doSupabase ? 'supabase' : 'seed';

    // Cache curto no CDN: o site nao fica lento e o estoque
    // aparece no maximo 1 minuto depois da mudanca.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({
      ok: true,
      origem,
      publicavel: temSupabase() || temToken(),
      veiculos: doSupabase || undefined,
      mensagem: temSupabase()
        ? 'Supabase conectado: o estoque vem do banco em tempo real.'
        : temToken()
          ? 'Publicacao via GitHub: cada alteracao dispara um deploy.'
          : 'Modo local: baixe o vehicles.js e substitua em data/vehicles.js.'
    });
  }

  /* -------------------------------------------------------------
     DELETE — remove um veiculo
     ------------------------------------------------------------- */
  if (req.method === 'DELETE') {
    const id = Number(req.query?.id || req.body?.id);
    if (!id) return erro(res, 400, 'Informe o id do veiculo.');

    if (temSupabase()) {
      try {
        await removerVeiculo(id);
        return res.status(200).json({ ok: true, mensagem: 'Veiculo removido.' });
      } catch (e) {
        return erro(res, 502, 'Nao foi possivel remover: ' + e.message);
      }
    }

    return erro(res, 503, 'Remocao automatica disponivel apenas com Supabase ou GitHub configurados.');
  }

  /* -------------------------------------------------------------
     POST — grava o estoque
     ------------------------------------------------------------- */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return erro(res, 405, 'Metodo nao permitido');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return erro(res, 400, 'JSON invalido'); }
  }
  body = body || {};

  const veiculos = Array.isArray(body.veiculos) ? body.veiculos : null;
  if (!veiculos) return erro(res, 400, 'Envie a lista de veiculos.');

  for (const v of veiculos) {
    if (!v || !v.id || !v.marca || !v.modelo) {
      return erro(res, 400, 'Veiculo invalido: id, marca e modelo sao obrigatorios.');
    }
  }

  const mensagem = String(body.mensagem || 'Atualiza o estoque publicado no site').slice(0, 120);

  /* --- Preferencia 1: Supabase --- */
  if (temSupabase()) {
    try {
      for (const v of veiculos) {
        await salvarVeiculo(v);
      }
      return res.status(200).json({
        ok: true,
        origem: 'supabase',
        mensagem: 'Estoque salvo no banco. O site atualiza em instantes.'
      });
    } catch (e) {
      console.error('[veiculos] erro no Supabase:', e.message);
      return erro(res, 502, 'Nao foi possivel salvar no banco: ' + e.message);
    }
  }

  /* --- Preferencia 2: GitHub --- */
  if (temToken()) {
    const conteudo =
      cabecalho() +
      'window.SV_VEHICLES = ' +
      JSON.stringify(veiculos, null, 2) +
      ';\n';

    try {
      const result = await salvarArquivo(CAMINHO, conteudo, mensagem);
      return res.status(200).json({
        ok: true,
        origem: 'github',
        mensagem: 'Estoque salvo no repositorio. O site atualiza em instantes.',
        commit: result.commit ? result.commit.sha : null,
        url: result.content ? result.content.html_url : null
      });
    } catch (e) {
      console.error('[veiculos] erro no GitHub:', e.message);
      return erro(res, 502, 'Nao foi possivel salvar: ' + e.message);
    }
  }

  /* --- Sem backend: orienta o fluxo manual --- */
  return erro(res, 503, 'Publicacao automatica desabilitada.', {
    dica: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (recomendado) ou GITHUB_TOKEN. Sem eles, baixe o vehicles.js e substitua em data/vehicles.js.'
  });
}
