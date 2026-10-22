/**
 * Teste real do tempo de atualizacao: salva uma alteracao no banco
 * (como o painel faz) e mede quanto tempo o site publico leva para
 * mostrar o valor novo.
 *
 * Uso: node medir-atualizacao.mjs
 */
const base = 'https://sv-multimarcas.vercel.app';

const espera = ms => new Promise(r => setTimeout(r, ms));
const iso = () => new Date().toISOString().substring(11, 19);

async function getEstoque(cacheBuster = false) {
  const url = base + '/api/veiculos' + (cacheBuster ? '?t=' + Date.now() : '');
  const r = await fetch(url);
  return { json: await r.json(), headers: r.headers };
}

(async () => {
  const antes = await getEstoque();
  const v2 = antes.json.veiculos.find(v => v.id === 2);
  const precoOriginal = v2.preco;
  console.log('preco original do veiculo 2:', precoOriginal);

  // 1) Salva (igual o painel faz)
  const novoPreco = precoOriginal + 1234;
  const veiculos = antes.json.veiculos.map(v => (v.id === 2 ? { ...v, preco: novoPreco } : v));
  const t0 = Date.now();
  const post = await fetch(base + '/api/veiculos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ veiculos, mensagem: 'teste de tempo de atualizacao' })
  });
  console.log('POST /api/veiculos ->', post.status, '(' + (Date.now() - t0) + 'ms)');

  // 2) Quanto tempo a API (com cache do CDN) devolve o valor novo?
  let apiOk = null;
  for (let i = 0; i < 40; i++) {
    const r = await getEstoque(false);
    const p = r.json.veiculos.find(v => v.id === 2).preco;
    if (p === novoPreco) { apiOk = Date.now() - t0; break; }
    await espera(2000);
  }
  console.log('API devolvendo o preco novo apos:', apiOk === null ? 'NAO (60s+)' : (apiOk / 1000).toFixed(1) + 's');

  // 3) Quanto tempo o SITE PUBLICO mostra o valor novo?
  let siteOk = null;
  for (let i = 0; i < 40; i++) {
    const html = await (await fetch(base + '/?t=' + Date.now())).text();
    const achou = html.includes('novoPrecoMarcador') || html.includes(novoPreco.toLocaleString('pt-BR'));
    const html2 = await (await fetch(base + '/api/veiculos?t=' + Date.now())).text();
    if (achou || html2.includes('novoPrecoMarcador')) { siteOk = Date.now() - t0; break; }
    await espera(2000);
  }
  console.log('Site publico refletindo apos:', siteOk === null ? 'NAO (60s+)' : (siteOk / 1000).toFixed(1) + 's');

  // 4) Restaura o preco
  const restore = await getEstoque(true);
  const veiculos2 = restore.json.veiculos.map(v => (v.id === 2 ? { ...v, preco: precoOriginal } : v));
  const r = await fetch(base + '/api/veiculos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ veiculos: veiculos2, mensagem: 'restaura preco de teste' })
  });
  console.log('preco restaurado ->', r.status, '| valor:', precoOriginal);
})();
