/**
 * SV Multimarcas — Upload de fotos do veiculo
 *
 * POST /api/upload
 * Body: { nome: '1-frente.jpg', dados: 'data:image/jpeg;base64,...' }
 *
 * Prioridade: Vercel Blob > GitHub (images/carros/).
 * O site passa a exibir a foto assim que o deploy automatico conclui.
 */

import { salvarArquivo, temToken, erro } from './_github.js';
import { temBlob, subirFoto, removerFoto } from './_blob.js';

const PASTA_GIT = 'images/carros';
const PASTA_BLOB = 'carros';
const TAMANHO_MAX = 8 * 1024 * 1024; // 8 MB

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return erro(res, 405, 'Metodo nao permitido');
  }

  if (!temBlob() && !temToken()) {
    return erro(res, 503, 'O envio de fotos nao esta disponivel no momento.', {
      dica: 'Fale com o responsavel pelo site para habilitar o envio de fotos.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return erro(res, 400, 'JSON invalido'); }
  }
  body = body || {};

  const nome = String(body.nome || '').trim();
  const dados = String(body.dados || '');

  if (!nome) return erro(res, 400, 'Informe o nome do arquivo.');
  if (!dados) return erro(res, 400, 'Nenhuma imagem recebida.');

  // Extrai o binario do data URL e valida o tipo
  const match = dados.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/i);
  if (!match) {
    return erro(res, 400, 'Formato invalido. Envie uma imagem PNG, JPEG ou WebP.');
  }

  const tipo = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const binario = Buffer.from(match[3], 'base64');

  if (binario.length > TAMANHO_MAX) {
    return erro(res, 413, 'Imagem muito grande (maximo 8 MB).');
  }

  // Nome seguro: apenas letras, numeros, ponto, hifen e underscore
  const seguro = nome
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase();

  if (!seguro || !/\.(png|jpe?g|webp|gif)$/i.test(seguro)) {
    return erro(res, 400, 'Extensao invalida. Use .jpg, .jpeg, .png ou .webp.');
  }

  /* --- Preferencia 1: Vercel Blob --- */
  if (temBlob()) {
    try {
      const r = await subirFoto(binario, `${PASTA_BLOB}/${seguro}`, tipo);

      // Apaga a foto anterior (o blob antigo) para nao acumular lixo.
      // O cliente manda o caminho antigo em "substituir" — pode vir como
      // pathname puro (carros/1-frente.webp) ou como a URL do site
      // (/api/foto?pathname=carros%2F1-frente.webp).
      let antigo = String(body.substituir || '').trim();
      if (antigo.indexOf('/api/foto?pathname=') > -1) {
        try {
          antigo = decodeURIComponent(antigo.split('pathname=')[1].split('&')[0]);
        } catch { antigo = ''; }
      }
      let apagouAntigo = false;
      if (antigo && antigo.startsWith(PASTA_BLOB + '/') && antigo !== r.pathname) {
        try {
          await removerFoto(antigo);
          apagouAntigo = true;
        } catch (e) {
          // Falha ao limpar o antigo nao impede o upload novo
          console.warn('[upload] nao foi possivel apagar a foto anterior:', e.message);
        }
      }

      return res.status(200).json({
        ok: true,
        origem: 'blob',
        caminho: r.url,
        url: r.url,
        pathname: r.pathname,
        privado: r.privado,
        bytes: r.bytes,
        apagouAntigo
      });
    } catch (e) {
      console.error('[upload] erro no Vercel Blob:', e.message);
      return erro(res, 502, 'Nao foi possivel enviar a foto: ' + e.message);
    }
  }

  /* --- Preferencia 2: GitHub --- */
  if (temToken()) {
    const caminho = `${PASTA_GIT}/${seguro}`;
    try {
      await salvarArquivo(caminho, binario, `Foto: ${seguro}`);
      return res.status(200).json({
        ok: true,
        origem: 'github',
        caminho,
        url: '/' + caminho,
        bytes: binario.length
      });
    } catch (e) {
      console.error('[upload] erro ao gravar no GitHub:', e.message);
      return erro(res, 502, 'Nao foi possivel enviar a foto: ' + e.message);
    }
  }

  return erro(res, 503, 'Upload indisponivel.');
}
