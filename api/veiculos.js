/**
 * SV Multimarcas — Estoque publicado
 *
 * GET    /api/veiculos  -> lista o estoque (Neon > GitHub > seed local)
 * POST   /api/veiculos  -> grava o estoque (Neon > fallback GitHub)
 * DELETE /api/veiculos  -> remove um veiculo (Neon)
 *
 * A fonte de verdade e o Neon (PostgreSQL). A connection string e
 * PRIVADA: so estas functions fala com o banco.
 */

import { salvarArquivo, temToken, erro } from './_github.js';
import {
  temBanco,
  lerVeiculos,
  salvarVeiculo,
  removerVeiculo,
  garantirTabelas
} from './_db.js';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // HEAD: same headers as GET, but no body (health check / cache check)
  if (req.method === 'HEAD') {
    res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=60');
    return res.status(200).end();
  }

  /* -------------------------------------------------------------
     GET — lista o estoque
     ------------------------------------------------------------- */
  if (req.method === 'GET') {
    let veiculos = null;
    let origem = 'seed';

    if (temBanco()) {
      try {
        veiculos = await lerVeiculos();
        if (veiculos && veiculos.length) origem = 'neon';
      } catch (e) {
        console.warn('[veiculos] Neon indisponivel:', e.message);
      }
    }

    // Cache curto no CDN: rapido e o estoque aparece no maximo
    // 20 segundos depois da mudanca (antes era 60s e o funcionario
    // achava que o site nao tinha atualizado).
    res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=60');

    return res.status(200).json({
      ok: true,
      origem,
      publicavel: temBanco() || temToken(),
      veiculos: veiculos || undefined,
      mensagem: temBanco()
        ? 'Neon conectado: o estoque vem do banco em tempo real.'
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

    if (!temBanco()) {
      return erro(res, 503, 'Remocao automatica disponivel apenas com o Neon configurado.');
    }

    try {
      await removerVeiculo(id);
      return res.status(200).json({ ok: true, mensagem: 'Veiculo removido do estoque.' });
    } catch (e) {
      console.error('[veiculos] erro ao remover:', e.message);
      return erro(res, 502, 'Nao foi possivel remover: ' + e.message);
    }
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

  /* --- Preferencia 1: Neon --- */
  if (temBanco()) {
    try {
      await garantirTabelas();
      for (const v of veiculos) {
        await salvarVeiculo(v);
      }
      return res.status(200).json({
        ok: true,
        origem: 'neon',
        mensagem: 'Estoque salvo no banco. O site atualiza em instantes.'
      });
    } catch (e) {
      console.error('[veiculos] erro no Neon:', e.message);
      return erro(res, 502, 'Nao foi possivel salvar no banco: ' + e.message);
    }
  }

  /* --- Preferencia 2: GitHub --- */
  if (temToken()) {
    // Remove data URLs antes de gravar: base64 no vehicles.js
    // deixa o script do site gigabytes.
    const limpo = veiculos.map(v => ({
      ...v,
      fotos: {
        frente: v.fotos?.frente?.startsWith('data:') ? 'images/placeholder-veiculo.svg' : (v.fotos?.frente || 'images/placeholder-veiculo.svg'),
        interior: v.fotos?.interior?.startsWith('data:') ? 'images/placeholder-veiculo.svg' : (v.fotos?.interior || 'images/placeholder-veiculo.svg'),
        traseira: v.fotos?.traseira?.startsWith('data:') ? 'images/placeholder-veiculo.svg' : (v.fotos?.traseira || 'images/placeholder-veiculo.svg'),
        extras: (v.fotos?.extras || []).filter(e => typeof e === 'string' && !e.startsWith('data:'))
      }
    }));

    const conteudo =
      CABECALHO +
      'window.SV_VEHICLES = ' +
      JSON.stringify(limpo, null, 2) +
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
  return erro(res, 503, 'A publicacao automatica nao esta disponivel no momento.', {
    dica: 'Fale com o responsavel pelo site para habilitar a publicacao automatica.'
  });
}
