/**
 * Limpa fotos do Vercel Blob que NAO estao referenciadas no banco.
 *
 * Trocar a foto de um veiculo cria um arquivo novo (nome versionado) e
 * apaga o antigo — mas se algo falhar no meio, o arquivo velho fica
 * ocupando espaco. Este script lista o que existe no Blob e remove
 * o que ninguem usa.
 *
 * Uso: cd scripts && node limpar-blobs-orfaos.mjs
 */
import { readFileSync } from 'node:fs';
import { list, del } from '@vercel/blob';

const token =
  process.env.BLOB_READ_WRITE_TOKEN ||
  (() => {
    const temp = process.env.TEMP || '.';
    try {
      return readFileSync(temp + '/BLOB_READ_WRITE_TOKEN.txt', 'utf8').trim();
    } catch {
      return '';
    }
  })();

if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN nao encontrado.');
  process.exit(1);
}

// Veiculos que estão no ar (fotos em uso)
const emUso = new Set();
try {
  const r = await fetch('https://sv-multimarcas.vercel.app/api/veiculos?t=' + Date.now());
  const j = await r.json();
  for (const v of j.veiculos || []) {
    for (const caminho of Object.values(v.fotos || {})) {
      if (typeof caminho !== 'string') continue;
      const m = caminho.match(/pathname=([^&]+)/);
      emUso.add(decodeURIComponent(m ? m[1] : caminho));
    }
  }
} catch (e) {
  console.error('Nao foi possivel ler o estoque:', e.message);
  process.exit(1);
}

console.log('Fotos em uso:', emUso.size);

let { blobs } = await list({ token, prefix: 'carros/' });
console.log('Arquivos no Blob:', blobs.length);

const orfaos = blobs.filter(b => !emUso.has(b.pathname));

if (!orfaos.length) {
  console.log('\nNenhum arquivo orfao. Tudo limpo.');
} else {
  console.log('\nOrfaos a remover:');
  for (const b of orfaos) {
    console.log('  ' + b.pathname + '  (' + Math.round(b.size / 1024) + 'KB)');
  }
  const apagar = process.argv.includes('--apagar');
  for (const b of orfaos) {
    if (!apagar) {
      console.log('\nUse --apagar para remover de verdade.');
      break;
    }
    await del(b.pathname, { token });
    console.log('  removido: ' + b.pathname);
  }
}
