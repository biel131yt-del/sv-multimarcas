/**
 * SV Multimarcas — Servidor de fotos do Blob
 *
 * GET /api/foto?pathname=carros/1-frente.jpg
 *
 * So e necessario quando o Blob store e PRIVADO: as fotos sao
 * lidas com a service key e entregues pelo CDN da Vercel.
 * Quando o store e publico, o site usa a URL direta e esta
 * function nem e chamada.
 */

import { lerFoto, temBlob } from './_blob.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  if (!temBlob()) {
    return res.status(404).json({ error: 'Storage nao configurado' });
  }

  const pathname = req.query?.pathname;
  if (!pathname) {
    return res.status(400).json({ error: 'Informe o pathname' });
  }

  // Impede acesso fora da pasta de veiculos
  if (!pathname.startsWith('carros/')) {
    return res.status(403).json({ error: 'Caminho nao permitido' });
  }

  try {
    const blob = await lerFoto(pathname);
    if (!blob) {
      return res.status(404).json({ error: 'Foto nao encontrada' });
    }

    // O stream e um ReadableStream web: converte via Response (padrao do Node 18+)
    const buffer = Buffer.from(await new Response(blob.stream).arrayBuffer());

    res.setHeader('Content-Type', blob.contentType || 'image/jpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (blob.etag) res.setHeader('ETag', blob.etag);

    // 304 quando o browser ja tem a versao em cache
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && blob.etag && ifNoneMatch === blob.etag) {
      return res.status(304).end();
    }

    return res.status(200).end(buffer);
  } catch (e) {
    console.error('[foto] erro:', e.message);
    return res.status(500).json({ error: 'Nao foi possivel servir a foto' });
  }
}
