/**
 * Corrige fotos salvas como data URL (base64) no banco,
 * substituindo pelo path real em images/carros/.
 *
 * Uso: node scripts/corrigir-fotos.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');

let dsn = process.env.DATABASE_URL;
if (!dsn) {
  const temp = process.env.TEMP || '.';
  dsn = readFileSync(resolve(temp, 'dsn.txt'), 'utf8').trim();
}

const client = new pg.Client({
  connectionString: dsn,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
console.log('Conectado.\n');

const { rows } = await client.query('select id, marca, fotos from vehicles order by id');

for (const v of rows) {
  const fotos = v.fotos || {};
  const mudancas = [];

  for (const angulo of ['frente', 'interior', 'traseira']) {
    const valor = fotos[angulo];
    if (typeof valor === 'string' && valor.startsWith('data:')) {
      // O nome do arquivo carrega o id e o angulo: <id>-<angulo>.<ext>
      const nome = `${v.id}-${angulo}.jpg`;
      const novo = `images/carros/${nome}`;
      mudancas.push({ angulo, de: 'data URL (' + valor.length + ' bytes)', para: novo });
      fotos[angulo] = novo;
    }
  }

  for (const extra of fotos.extras || []) {
    if (typeof extra === 'string' && extra.startsWith('data:')) {
      fotos.extras = (fotos.extras || []).filter(e => e !== extra);
      mudancas.push({ angulo: 'extra', de: 'data URL', para: 'removido' });
    }
  }

  if (mudancas.length) {
    await client.query(
      'update vehicles set fotos = $2::jsonb, atualizado_em = now() where id = $1',
      [v.id, JSON.stringify(fotos)]
    );
    console.log(`Veiculo ${v.id} (${v.marca}):`);
    mudancas.forEach(m => console.log(`   ${m.angulo}: ${m.de} -> ${m.para}`));
  }
}

console.log('\n--- estado final ---');
const finais = await client.query(
  "select id, marca, left(fotos->>'frente', 34) as frente, length(fotos->>'frente') as tam from vehicles order by id"
);
finais.rows.forEach(r => {
  console.log(`  ${String(r.id).padStart(2)} ${r.marca.padEnd(14)} ${r.frente} (${r.tam} bytes)`);
});

await client.end();
console.log('\nConcluido.');
