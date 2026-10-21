/**
 * SV Multimarcas — Salvar o estoque publicado
 *
 * POST /api/veiculos
 * Body: { veiculos: [ ... ], mensagem?: 'texto do commit' }
 *
 * Grava data/vehicles.js no repositorio. O push dispara o deploy
 * automatico da Vercel e o site passa a mostrar o estoque novo.
 */

import { salvarArquivo, temToken, erro } from './_github.js';

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
 * Gerado pelo painel administrativo em ${'{{DATA}}'}
 */
`;

function cabecalho() {
  return CABECALHO.replace('{{DATA}}', new Date().toLocaleString('pt-BR'));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  /* -------------------------------------------------------------
     GET — status da publicacao automatica
     ------------------------------------------------------------- */
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      publicavel: temToken(),
      mensagem: temToken()
        ? 'Publicacao automatica ativa: as alteracoes vao para o site sozinhas.'
        : 'Modo manual: baixe o vehicles.js e substitua em data/vehicles.js.'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return erro(res, 405, 'Metodo nao permitido');
  }

  if (!temToken()) {
    return erro(res, 503, 'Salvar automatico desabilitado: configure GITHUB_TOKEN no projeto.', {
      dica: 'Sem o token, use o botao "Baixar vehicles.js" e substitua o arquivo em data/.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return erro(res, 400, 'JSON invalido'); }
  }
  body = body || {};

  const veiculos = Array.isArray(body.veiculos) ? body.veiculos : null;
  if (!veiculos) return erro(res, 400, 'Envie a lista de veiculos.');

  // Validacao minima de cada veiculo
  for (const v of veiculos) {
    if (!v || !v.id || !v.marca || !v.modelo) {
      return erro(res, 400, 'Veiculo invalido: id, marca e modelo sao obrigatorios.');
    }
  }

  const mensagem = String(body.mensagem || 'Atualiza o estoque publicado no site').slice(0, 120);
  const conteudo =
    cabecalho() +
    'window.SV_VEHICLES = ' +
    JSON.stringify(veiculos, null, 2) +
    ';\n';

  try {
    const result = await salvarArquivo(CAMINHO, conteudo, mensagem);
    return res.status(200).json({
      ok: true,
      mensagem: 'Estoque salvo. O site sera atualizado em instantes.',
      commit: result.commit ? result.commit.sha : null,
      url: result.content ? result.content.html_url : null
    });
  } catch (e) {
    console.error('[veiculos] erro ao gravar no GitHub:', e.message);
    return erro(res, 502, 'Nao foi possivel salvar: ' + e.message);
  }
}
