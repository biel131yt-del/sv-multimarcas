/**
 * Aguarda um arquivo novo ficar disponivel no ar (deploy automatico).
 * Uso: node aguardar-arquivo.mjs /data/img-variantes.js
 */
const base = 'https://sv-multimarcas.vercel.app';
const caminho = process.argv[2] || '/data/img-variantes.js';
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  for (let i = 1; i <= 30; i++) {
    try {
      const r = await fetch(base + caminho + '?t=' + Date.now(), { cache: 'no-store' });
      const txt = await r.text();
      if (r.status === 200 && txt.length > 10) {
        console.log(`\nNO AR: ${caminho} (${txt.length} bytes) — tentativa ${i}`);
        process.exit(0);
      }
      console.log(`tentativa ${i}: status=${r.status}`);
    } catch (e) {
      console.log(`tentativa ${i}: ${e.message}`);
    }
    await espera(15000);
  }
  console.log('\nTimeout.');
  process.exit(1);
})();
