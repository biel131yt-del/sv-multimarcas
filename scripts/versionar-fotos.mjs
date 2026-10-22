/**
 * Versiona o nome das fotos que ainda usam o nome fixo.
 *
 * Por que: o /api/foto responde com cache de 1 ano e "immutable".
 * Se a foto for trocada mantendo o mesmo caminho, quem ja abriu a
 * pagina continua vendo a foto antiga (e a foto "sumiu" no celular).
 * Por isso o upload gera um nome com versao: <id>-<angulo>-<versao>.<ext>
 *
 * Este script renomeia no Blob as fotos antigas (sem versao) e atualiza
 * o banco + o seed local.
 *
 * Uso: cd scripts && node versionar-fotos.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rename, list, del } from '@vercel/blob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');
const SITE = 'https://sv-multimarcas.vercel.app';

const token =
  process.env.BLOB_READ_WRITE_TOKEN ||
  (() => {
    const temp = process.env.TEMP || '.';
    const arq = resolve(temp, 'BLOB_READ_WRITE_TOKEN.txt');
    return existsSync(arq) ? readFileSync(arq, 'utf8').trim() : '';
  })();

if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN nao encontrado.');
  process.exit(1);
}

// Nome com versao: 1-frente-mviv77g6.webp
const COM_VERSAO = /^(\d+)-(frente|interior|traseira|extra\d*)-([a-z0-9]{6,})\.(webp|jpg|jpeg|png)$/i;

const caminhoDe = url => {
  if (typeof url !== 'string') return null;
  const m = url.match(/pathname=([^&]+)/);
  return decodeURIComponent(m ? m[1] : url);
};

(async () => {
  const r = await fetch(SITE + '/api/veiculos?t=' + Date.now());
  const j = await r.json();
  const veiculos = j.veiculos || [];
  console.log('Veiculos:', veiculos.length);

  const { blobs } = await list({ token, prefix: 'carros/' });
  console.log('Arquivos no Blob:', blobs.length);

  let mudados = 0;
  let jaVersionados = 0;

  for (const v of veiculos) {
    for (const angulo of ['frente', 'interior', 'traseira']) {
      const antigo = caminhoDe(v.fotos?.[angulo]);
      if (!antigo) continue;
      if (!antigo.startsWith('carros/')) continue;

      const nome = antigo.replace(/^carros\//, '');
      if (COM_VERSAO.test(nome)) { jaVersionados++; continue; }

      // Gera o nome versionado
      const base = nome.replace(/\.(webp|jpg|jpeg|png)$/i, '');
      const ext = (nome.match(/\.(webp|jpg|jpeg|png)$/i) || [, 'webp'])[1].toLowerCase();
      const novoNome = `${base}-${Date.now().toString(36)}.${ext}`;
      const novoPath = 'carros/' + novoNome;

      const existe = blobs.find(b => b.pathname === antigo);
      if (!existe) {
        console.log('  ! arquivo nao esta no Blob:', antigo);
        continue;
      }

      try {
        await rename(antigo, novoPath, { access: 'private', token });
        console.log(`  ${v.id} ${angulo}: ${antigo} -> ${novoPath}`);
        v.fotos[angulo] = '/api/foto?pathname=' + encodeURIComponent(novoPath);
        mudados++;
      } catch (e) {
        console.error('  ERRO ao renomear', antigo, '->', e.message);
      }
    }
  }

  console.log(`\nRenomeados: ${mudados} | ja versionados: ${jaVersionados}`);

  if (mudados) {
    const post = await fetch(SITE + '/api/veiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ veiculos, mensagem: 'Versiona o nome das fotos' })
    });
    console.log('Banco atualizado:', post.status);
  }
})();
