/**
 * SV Multimarcas — Upload de fotos do veiculo
 *
 * POST /api/upload
 * Body: { nome: '1-frente.jpg', dados: 'data:image/jpeg;base64,...' }
 *
 * Grava a imagem no repositorio (images/carros/) e devolve o caminho
 * para ser usado no cadastro do veiculo. O push dispara o deploy
 * automatico da Vercel.
 */

import { salvarArquivo, temToken, erro } from './_github.js';

const PASTA = 'images/carros';
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

  if (!temToken()) {
    return erro(res, 503, 'Upload desabilitado: configure GITHUB_TOKEN no projeto.', {
      dica: 'Sem o token, use "Baixar vehicles.js" e envie as fotos em images/carros/.'
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

  const caminho = `${PASTA}/${seguro}`;

  try {
    await salvarArquivo(
      caminho,
      binario,
      `Foto: ${seguro}`
    );
  } catch (e) {
    console.error('[upload] erro ao gravar no GitHub:', e.message);
    return erro(res, 502, 'Nao foi possivel enviar a foto: ' + e.message);
  }

  return res.status(200).json({
    ok: true,
    caminho,
    url: '/' + caminho,
    bytes: binario.length
  });
}
