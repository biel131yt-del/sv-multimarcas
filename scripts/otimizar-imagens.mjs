/**
 * Otimizador de imagens — SV Multimarcas
 *
 * Converte as fotos do site para WebP (formato moderno, ~30% menor que JPEG
 * com a mesma qualidade visual) e gera versoes responsivas para o
 * atributo srcset, que reduz o peso no 4G e melhora o LCP no mobile.
 *
 * Uso:
 *   cd scripts
 *   npm install
 *   node otimizar-imagens.mjs
 *
 * As fotos de veiculos reais ficam em ../images/carros/ e tambem sao
 * otimizadas por este script quando existem.
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES = resolve(__dirname, '..', 'images');

/** Larguras geradas para srcset */
const LARGURAS = [400, 800, 1200, 1600];
const QUALIDADE = 82;

async function otimizar(caminho) {
  const ext = extname(caminho).toLowerCase();
  if (!['.jpg', '.jpeg', '.jfif', '.png', '.jpg'].includes(ext)) return null;

  const dir = dirname(caminho);
  const nome = basename(caminho, ext);
  const destino = join(dir, `${nome}.webp`);

  try {
    const meta = await sharp(caminho).metadata();
    const larguraOriginal = meta.width || 1600;

    // WebP principal (largura original, limitado a 1920)
    const larguraPrincipal = Math.min(larguraOriginal, 1920);
    await sharp(caminho)
      .resize({ width: larguraPrincipal, withoutEnlargement: true })
      .webp({ quality: QUALIDADE })
      .toFile(destino);

    // Versoes responsivas
    const srcset = [];
    for (const w of LARGURAS) {
      if (w > larguraOriginal) continue;
      const arquivo = join(dir, `${nome}-${w}.webp`);
      await sharp(caminho)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALIDADE })
        .toFile(arquivo);
      srcset.push(`${nome}-${w}.webp ${w}w`);
    }

    const antes = (await stat(caminho)).size;
    const depois = (await stat(destino)).size;
    const economia = Math.round((1 - depois / antes) * 100);

    console.log(
      `  ${basename(caminho)} -> ${basename(destino)}  ` +
      `${(antes / 1024).toFixed(0)}KB -> ${(depois / 1024).toFixed(0)}KB (-${economia}%)` +
      (srcset.length ? `  [${srcset.length} variantes srcset]` : '')
    );

    return { src: destino, srcset, economia, antes, depois };
  } catch (err) {
    console.error(`  ERRO em ${basename(caminho)}: ${err.message}`);
    return null;
  }
}

async function listarImagens(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  const entradas = await readdir(dir, { withFileTypes: true });
  for (const e of entradas) {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) await listarImagens(caminho, acc);
    else acc.push(caminho);
  }
  return acc;
}

async function main() {
  console.log('\nOtimizando imagens da SV Multimarcas\n');

  const todos = await listarImagens(IMAGES);
  const otimizaveis = todos.filter(f => {
    const ext = extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.jfif', '.png'].includes(ext);
  });

  if (!otimizaveis.length) {
    console.log('  Nenhuma imagem para otimizar.');
    return;
  }

  let totalAntes = 0;
  let totalDepois = 0;
  let contador = 0;

  for (const img of otimizaveis) {
    const r = await otimizar(img);
    if (r) {
      contador++;
      totalAntes += r.antes;
      totalDepois += r.depois;
    }
  }

  if (contador) {
    const economia = Math.round((1 - totalDepois / totalAntes) * 100);
    console.log(`\n  ${contador} imagem(ns) otimizada(s)`);
    console.log(
      `  Total: ${(totalAntes / 1024).toFixed(0)}KB -> ${(totalDepois / 1024).toFixed(0)}KB (-${economia}%)\n`
    );
  }
  // Atualiza o mapa de variantes (data/img-variantes.js) para o srcset
  // so apontar para arquivos que existem de verdade (evita 404).
  console.log('  Atualizando mapa de variantes...');
  await import('./gerar-mapa-variantes.mjs');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
