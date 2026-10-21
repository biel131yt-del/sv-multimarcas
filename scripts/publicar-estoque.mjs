/**
 * Publica o estoque local (data/vehicles.js) no site via POST /api/veiculos.
 *
 * Le o arquivo local, envia o array completo para a API, que grava no
 * GitHub e dispara o deploy automatico.
 *
 * Uso: node scripts/publicar-estoque.mjs [url]
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');
const url = process.argv[2] || 'https://sv-multimarcas.vercel.app';

const raw = readFileSync(resolve(raiz, 'data', 'vehicles.js'), 'utf8');
const arrayJs = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
const veiculos = new Function('return ' + arrayJs + ';')();

console.log('Veículos locais:', veiculos.length);
veiculos.forEach(v => {
  const fotos = [v.fotos?.frente, v.fotos?.interior, v.fotos?.traseira]
    .filter(f => f && !f.includes('placeholder')).length;
  console.log(`  ${String(v.id).padStart(2)} ${v.marca} ${v.modelo} — ${fotos}/3 fotos`);
});

const resp = await fetch(url + '/api/veiculos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    veiculos,
    mensagem: 'Atualiza o estoque publicado no site'
  })
});

const texto = await resp.text();
console.log('\nResposta (' + resp.status + '):', texto.slice(0, 300));

if (resp.ok) {
  console.log('\nEstoque publicado. O site atualiza em instantes.');
} else {
  console.log('\nFalhou. Verifique o GITHUB_TOKEN no projeto.');
  process.exitCode = 1;
}
