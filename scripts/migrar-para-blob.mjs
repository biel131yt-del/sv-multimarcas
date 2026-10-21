/**
 * Migra as fotos de images/carros/ (GitHub) para o Vercel Blob
 * e atualiza o banco (Neon) com as novas URLs.
 *
 * Requer: BLOB_READ_WRITE_TOKEN e DATABASE_URL no ambiente
 * (ou %TEMP%\dsn.txt para o banco).
 *
 * Uso: node scripts/migrar-para-blob.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { put } from '@vercel/blob';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');

/* ---------- Credenciais ---------- */
function envOu(nome) {
  if (process.env[nome]) return process.env[nome];
  const temp = process.env.TEMP || '.';
  const arq = resolve(temp, nome === 'DATABASE_URL' ? 'dsn.txt' : nome + '.txt');
  if (existsSync(arq)) return readFileSync(arq, 'utf8').trim();
  return null;
}

const tokenBlob = envOu('BLOB_READ_WRITE_TOKEN');
if (!tokenBlob) {
  console.error('BLOB_READ_WRITE_TOKEN nao encontrada.');
  console.error('Crie em: Vercel > Storage > sv-multimarcas-blob > Tokens > Create Token');
  process.exit(1);
}

const dsn = envOu('DATABASE_URL');
if (!dsn) {
  console.error('DATABASE_URL nao encontrada.');
  process.exit(1);
}

/* ---------- Lista as fotos (GitHub) ---------- */
let arquivos = [];
try {
  const out = execSync(
    'gh api repos/biel131yt-del/sv-multimarcas/contents/images/carros --jq ".[].name"',
    { encoding: 'utf8', shell: 'cmd.exe' }
  );
  arquivos = out.split('\n').map(s => s.trim()).filter(s => /\.jpe?g$/i.test(s));
} catch {
  const pasta = resolve(raiz, 'images', 'carros');
  if (existsSync(pasta)) {
    arquivos = readdirSync(pasta).filter(f => /\.jpe?g$/i.test(f));
  }
}

console.log('Fotos em images/carros:', arquivos.length);
if (!arquivos.length) {
  console.log('Nada para migrar.');
  process.exit(0);
}

/* ---------- Banco ---------- */
const client = new pg.Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows: veiculos } = await client.query('select id, fotos from vehicles order by id');
const mapa = new Map(veiculos.map(v => [v.id, v.fotos || {}]));

/* ---------- Migra ---------- */
console.log('\nEnviando para o Vercel Blob...\n');

const feito = new Map(); // url antiga -> url nova

for (const nome of arquivos) {
  const caminhoAntigo = 'images/carros/' + nome;

  // Só migra se algum veiculo usa este arquivo
  const emUso = [...mapa.entries()].filter(([, fotos]) =>
    Object.values(fotos).includes(caminhoAntigo)
  );
  if (!emUso.length) {
    console.log(`  ${nome} — nao usado por nenhum veiculo, pulado`);
    continue;
  }

  // Baixa do GitHub
  const raw = execSync(
    `gh api repos/biel131yt-del/sv-multimarcas/contents/images/carros/${nome} --jq .content`,
    { encoding: 'utf8', shell: 'cmd.exe' }
  );
  const binario = Buffer.from(raw.replace(/\s/g, ''), 'base64');

  // Sobe pro Blob. Store privado exige access:'private'.
  const destino = 'carros/' + nome;
  const opcoes = {
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 31536000,
    token: tokenBlob
  };

  let resultado;
  let privado = false;
  try {
    resultado = await put(destino, binario, { ...opcoes, access: 'public' });
  } catch (e) {
    if (!/private store/i.test(String(e && e.message))) throw e;
    resultado = await put(destino, binario, { ...opcoes, access: 'private' });
    privado = true;
  }

  const url = privado
    ? '/api/foto?pathname=' + encodeURIComponent(resultado.pathname)
    : resultado.url;

  feito.set(caminhoAntigo, url);
  console.log(`  ${nome} -> ${url} (${(binario.length / 1024).toFixed(0)}KB${privado ? ', privado' : ''})`);
}

/* ---------- Atualiza o banco ---------- */
if (feito.size) {
  console.log('\nAtualizando o banco...');
  for (const [id, fotos] of mapa) {
    const novo = { ...fotos };
    let mudou = false;
    for (const angulo of ['frente', 'interior', 'traseira']) {
      if (novo[angulo] && feito.has(novo[angulo])) {
        novo[angulo] = feito.get(novo[angulo]);
        mudou = true;
      }
    }
    if (mudou) {
      await client.query(
        'update vehicles set fotos = $2::jsonb, atualizado_em = now() where id = $1',
        [id, JSON.stringify(novo)]
      );
      console.log(`  veiculo ${id} atualizado`);
    }
  }
}

await client.end();
console.log('\nConcluido. As fotos agora servem do Vercel Blob (CDN global).');
