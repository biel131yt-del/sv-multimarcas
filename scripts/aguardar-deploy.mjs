/**
 * Aguarda o deploy Automatico (GitHub -> Vercel) ficar no ar.
 * Confere se o redirect do middleware preserva a query string
 * (indica que a versao nova do middleware ja esta no ar).
 */
const alvo = process.argv[2] || '/admin/veiculo-editar.html?id=1';
const base = 'https://sv-multimarcas.vercel.app';

const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  for (let i = 1; i <= 25; i++) {
    let status = '?';
    let loc = '';
    try {
      const r = await fetch(base + alvo, { redirect: 'manual' });
      status = r.status;
      loc = r.headers.get('location') || '';
    } catch (e) {
      status = 'ERR ' + e.message;
    }
    const pronto = loc.includes('next=%2Fadmin%2Fveiculo-editar%3Fid%3D1');
    console.log(`tentativa ${i}: status=${status} location=${loc}`);
    if (pronto) {
      console.log('\nDEPLOY NO AR (middleware preserva a query string)');
      process.exit(0);
    }
    await espera(15000);
  }
  console.log('\nTimeout aguardando o deploy.');
  process.exit(1);
})();
