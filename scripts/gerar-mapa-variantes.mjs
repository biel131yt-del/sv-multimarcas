/**
 * Gera data/img-variantes.js — o mapa real de quais imagens tem
 * variantes responsivas (srcset).
 *
 * Sem isso, o site montava srcset com nomes de arquivo que nao existem
 * e o navegador pedia imagens com 404 (ex.: a foto do veiculo no GitHub
 * sem as variantes -400/-800 geradas).
 *
 * Uso: cd scripts && node gerar-mapa-variantes.mjs
 */
import { readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, '..');
const IMAGES = resolve(RAIZ, 'images');

const LARGURAS = [400, 800, 1200, 1600];

async function listar(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) await listar(caminho, acc);
    else acc.push(caminho);
  }
  return acc;
}

(async () => {
  const arquivos = await listar(IMAGES);
  const mapa = {};

  for (const arquivo of arquivos) {
    const ext = extname(arquivo).toLowerCase();
    if (!['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const nome = basename(arquivo, ext);
    // Nome base sem o sufixo de largura: "hero-400" -> "hero"
    const base = nome.replace(/-(400|800|1200|1600)$/, '');

    const dir = dirname(arquivo);
    const principal = join(dir, base + ext);
    if (!existsSync(principal)) continue; // e so uma variante solta

    const widths = [];
    for (const w of LARGURAS) {
      if (existsSync(join(dir, `${base}-${w}${ext}`))) widths.push(w);
    }
    if (!widths.length) continue;

    const caminhoWeb = '/' + relative(RAIZ, principal).split(sep).join('/');
    const existente = mapa[caminhoWeb] || [];
    mapa[caminhoWeb] = [...new Set([...existente, ...widths])].sort((a, b) => a - b);
  }

  const conteudo =
    '/**\n' +
    ' * Imagens que TÊM variantes responsivas (srcset).\n' +
    ' *\n' +
    ' * Gerado por scripts/gerar-mapa-variantes.mjs — não editar na mão.\n' +
    ' * Se a foto não estiver aqui, é porque não tem variantes: o site\n' +
    ' * usa a imagem original (sem srcset), sem gerar 404.\n' +
    ' */\n' +
    'window.SV_IMG_VARIANTES = ' +
    JSON.stringify(mapa, null, 2) +
    ';\n';

  await writeFile(resolve(RAIZ, 'data', 'img-variantes.js'), conteudo, 'utf8');

  console.log('data/img-variantes.js gerado com', Object.keys(mapa).length, 'imagem(ns):');
  for (const [k, v] of Object.entries(mapa)) {
    console.log('  ' + k + ' -> ' + v.join(', '));
  }
})();
