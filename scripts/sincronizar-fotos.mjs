/**
 * Sincroniza as fotos do banco com os arquivos que existem de fato
 * em images/carros/ (no GitHub ou localmente).
 *
 * - foto referenciada mas o arquivo nao existe -> placeholder
 * - foto nao referenciada mas o arquivo existe  -> usa o arquivo
 *
 * Uso: node scripts/sincronizar-fotos.mjs [repo]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');
const repo = process.argv[2] || 'biel131yt-del/sv-multimarcas';

// Lista os arquivos de images/carros no GitHub
let arquivos = [];
try {
  const out = execSync(
    `gh api repos/${repo}/contents/images/carros --jq ".[].name"`,
    { encoding: 'utf8', shell: 'cmd.exe' }
  );
  arquivos = out.split('\n').map(s => s.trim()).filter(s => /\.jpg$/i.test(s));
} catch (e) {
  console.log('Nao foi possivel listar no GitHub, usando a pasta local.');
  const pasta = resolve(raiz, 'images', 'carros');
  if (existsSync(pasta)) {
    arquivos = readdirSync(pasta).filter(f => /\.jpg$/i.test(f));
  }
}

console.log('Arquivos em images/carros:', arquivos.length);
arquivos.forEach(a => console.log('  ', a));

// Banco
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

const { rows } = await client.query('select id, marca, fotos from vehicles order by id');

console.log('\n--- ajuste ---');

for (const v of rows) {
  const fotos = v.fotos || {};
  const novo = { ...fotos };

  for (const angulo of ['frente', 'interior', 'traseira']) {
    const atual = fotos[angulo];

    // Path que aponta para um arquivo inexistente -> procura um substituto
    if (typeof atual === 'string' && atual.startsWith('images/carros/')) {
      const nome = atual.split('/').pop();
      if (!arquivos.includes(nome)) {
        const candidato = arquivos.find(a => a.startsWith(v.id + '-' + angulo));
        novo[angulo] = candidato
          ? 'images/carros/' + candidato
          : 'images/placeholder-veiculo.svg';
      }
    }
  }

  // Arquivo existe mas nao esta referenciado -> usa como frente/traseira
  for (const angulo of ['frente', 'interior', 'traseira']) {
    if (novo[angulo] && novo[angulo] !== 'images/placeholder-veiculo.svg') continue;
    const candidato = arquivos.find(a => a.startsWith(v.id + '-' + angulo));
    if (candidato) novo[angulo] = 'images/carros/' + candidato;
  }

  const mudou = JSON.stringify(novo) !== JSON.stringify(fotos);
  if (mudou) {
    await client.query(
      'update vehicles set fotos = $2::jsonb, atualizado_em = now() where id = $1',
      [v.id, JSON.stringify(novo)]
    );
    console.log(`  ${v.id} ${v.marca}: frente=${novo.frente} | traseira=${novo.traseira}`);
  }
}

const finais = await client.query(
  "select id, marca, fotos->>'frente' as f, fotos->>'traseira' as t from vehicles order by id"
);
console.log('\n--- estado final ---');
finais.rows.forEach(r => {
  console.log(`  ${String(r.id).padStart(2)} ${r.marca.padEnd(14)} frente=${(r.f || '').padEnd(38)} traseira=${r.t || ''}`);
});

await client.end();
console.log('\nConcluido.');
