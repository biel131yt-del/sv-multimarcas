/**
 * SV Multimancas — Helper do Vercel Blob (storage das fotos)
 *
 * O Neon cuida do banco; as fotos vao para o Vercel Blob, que e o
 * storage nativo da Vercel (mesma conta, mesmo deploy, CDN global).
 *
 * Variavel de ambiente:
 *   BLOB_READ_WRITE_TOKEN  gerado ao criar um Blob store no dashboard
 *
 * Sem token, o upload cai no fallback (GitHub).
 */

import { put } from '@vercel/blob';

export function temBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Sobe uma imagem no Vercel Blob.
 * @param {Buffer} binario
 * @param {string} nome  nome do arquivo (com pastas, ex.: 'carros/1-frente.jpg')
 * @param {string} tipo  mime type
 * @returns {Promise<string>} URL publica
 */
export async function subirFoto(binario, nome, tipo) {
  const resultado = await put(nome, binario, {
    access: 'public',
    contentType: tipo || 'image/jpeg',
    addRandomSuffix: false,
    cacheControlMaxAge: 31536000, // 1 ano (imagens nao mudam)
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
  return resultado.url;
}

/**
 * Remove uma foto do Blob (por URL publica).
 */
export async function removerFoto(url) {
  if (!url || !url.includes('/blob.vercel-storage.com/')) return false;
  const { del } = await import('@vercel/blob');
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return true;
}
