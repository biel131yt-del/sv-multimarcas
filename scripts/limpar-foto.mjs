/**
 * Remove a foto de teste de um veiculo (coloca o placeholder de volta).
 * Uso: node limpar-foto.mjs 2 frente
 */
const base = 'https://sv-multimarcas.vercel.app';
const id = Number(process.argv[2]);
const angulo = process.argv[3] || 'frente';

(async () => {
  const r = await fetch(base + '/api/veiculos?t=' + Date.now());
  const j = await r.json();
  const v = j.veiculos.find(x => x.id === id);
  if (!v) { console.log('veiculo nao encontrado'); process.exit(1); }

  console.log('antes :', v.fotos[angulo]);
  v.fotos[angulo] = 'images/placeholder-veiculo.svg';

  const post = await fetch(base + '/api/veiculos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ veiculos: j.veiculos, mensagem: 'limpa foto de teste do veiculo ' + id })
  });
  console.log('POST  :', post.status);
  console.log('depois:', v.fotos[angulo]);
})();
