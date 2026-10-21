/**
 * SV Multimarcas — Helper do Vercel Blob (storage das fotos)
 *
 * O Neon cuida do banco; as fotos vao para o Vercel Blob, que e o
 * storage nativo da Vercel (mesma conta, mesmo deploy, CDN global).
 *
 * Variaveis de ambiente (criadas ao conectar o store ao projeto):
 *   BLOB_READ_WRITE_TOKEN  token de escrita (criar no dashboard)
 *   BLOB_STORE_ID          id do store
 *
 * O store pode ser PRIVADO (padrao e mais seguro) ou PUBLICO.
 * - store publico : o blob vira URL publica e vai direto no <img src>
 * - store privado : o blob e servido pela function /api/foto
 *
 * Sem token, o upload cai no fallback (GitHub).
 */

import { put, get, del } from '@vercel/blob';

export function temBlob() {
  return !!(process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_STORE_ID);
}

/**
 * Sobe uma imagem no Vercel Blob.
 *
 * @param {Buffer} binario
 * @param {string} nome  nome do arquivo (com pastas, ex.: 'carros/1-frente.jpg')
 * @param {string} tipo  mime type
 * @returns {Promise<{url: string, pathname: string, privado: boolean, bytes: number}>}
 *          url: o que o site deve usar (URL publica ou /api/foto?pathname=...)
 */
export async function subirFoto(binario, nome, tipo) {
  const opcoes = {
    contentType: tipo || 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,   // reenviar foto do mesmo veiculo/angulo substitui
    cacheControlMaxAge: 31536000, // 1 ano (imagens nao mudam)
    token: process.env.BLOB_READ_WRITE_TOKEN
  };

  // 1) Tenta publico (store publico, ou blob publico em store privado)
  try {
    const resultado = await put(nome, binario, { ...opcoes, access: 'public' });
    return {
      url: resultado.url,
      pathname: resultado.pathname,
      privado: false,
      bytes: binario.length
    };
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    if (!/private store/i.test(msg)) throw e;
  }

  // 2) Store privado: grava como privado e serve via /api/foto
  const resultado = await put(nome, binario, { ...opcoes, access: 'private' });
  return {
    url: '/api/foto?pathname=' + encodeURIComponent(resultado.pathname),
    pathname: resultado.pathname,
    privado: true,
    bytes: binario.length
  };
}

/**
 * Le um blob privado e devolve os metadados + o stream.
 * @param {string} pathname  ex.: 'carros/1-frente.jpg'
 */
export async function lerFoto(pathname) {
  if (!pathname) return null;

  const resultado = await get(pathname, {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  if (!resultado || resultado.statusCode !== 200) return null;

  return {
    stream: resultado.stream,
    contentType: resultado.blob.contentType || 'image/jpeg',
    size: resultado.blob.size,
    etag: resultado.blob.etag
  };
}

/**
 * Remove uma foto do Blob (por pathname).
 */
export async function removerFoto(pathname) {
  if (!pathname) return false;
  await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return true;
}
