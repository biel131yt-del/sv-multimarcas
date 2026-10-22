/**
 * Espera uma string especifica aparecer no HTML publicado (com login).
 * Uso: node aguardar-texto.mjs "/admin/veiculo-editar.html?id=1" "imgPath(fotos.frente"
 */
const base = 'https://sv-multimarcas.vercel.app';
const caminho = process.argv[2] || '/admin/veiculo-editar.html?id=1';
const texto = process.argv[3] || '';
const espera = ms => new Promise(r => setTimeout(r, ms));

async function cookie() {
  const r = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha: process.env.SENHA_ADMIN || 'Teste12345' })
  });
  const c = (r.headers.get('set-cookie') || '').split(';')[0];
  return c;
}

(async () => {
  const ck = await cookie();
  if (!ck) { console.log('login falhou'); process.exit(1); }

  for (let i = 1; i <= 30; i++) {
    try {
      const r = await fetch(base + caminho, { headers: { cookie: ck }, cache: 'no-store' });
      const t = await r.text();
      if (t.includes(texto)) {
        console.log(`\nNO AR (${caminho}) — encontrou "${texto}" — tentativa ${i}`);
        process.exit(0);
      }
      console.log(`tentativa ${i}: status=${r.status} (ainda nao contem o texto)`);
    } catch (e) {
      console.log(`tentativa ${i}: ${e.message}`);
    }
    await espera(15000);
  }
  console.log('\nTimeout.');
  process.exit(1);
})();
