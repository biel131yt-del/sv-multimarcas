/**
 * Reenvia uma foto do GitHub para o Blob e atualiza o banco.
 * Útil quando o blob foi apagado mas a foto continua no repo.
 *
 * Uso: node scripts/restaurar-foto.mjs <nome-do-arquivo> <id-do-veiculo> <angulo>
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { put } from '@vercel/blob';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

function envOu(nome) {
  if (process.env[nome]) return process.env[nome];
  const temp = process.env.TEMP || '.';
  const arq = resolve(temp, nome === 'DATABASE_URL' ? 'dsn.txt' : nome + '.txt');
  try { return readFileSync(arq, 'utf8').trim(); } catch { return null; }
}

const [nome, idVeiculo, angulo = 'traseira'] = process.argv.slice(2);
if (!nome || !idVeiculo) {
  console.log('Uso: node scripts/restaurar-foto.mjs <arquivo.jpg> <id> [angulo]');
  process.exit(1);
}

const tokenBlob = envOu('BLOB_READ_WRITE_TOKEN');
const dsn = envOu('DATABASE_URL');
if (!tokenBlob || !dsn) {
  console.error('Faltam BLOB_READ_WRITE_TOKEN ou DATABASE_URL');
  process.exit(1);
}

// Baixa do GitHub
const raw = execSync(
  `gh api repos/biel131yt-del/sv-multimarcas/contents/images/carros/${nome} --jq .content`,
  { encoding: 'utf8', shell: 'cmd.exe' }
);
const bin = Buffer.from(raw.replace(/\s/g, ''), 'base64');
console.log(`Baixado do GitHub: ${nome} (${Math.round(bin.length / 1024)}KB)`);

// Sobe pro Blob (privado)
const r = await put('carros/' + nome, bin, {
  access: 'private',
  contentType: 'image/jpeg',
  addRandomSuffix: false,
  allowOverwrite: true,
  cacheControlMaxAge: 31536000,
  token: tokenBlob
});
const url = '/api/foto?pathname=' + encodeURIComponent(r.pathname);
console.log('Blob:', r.pathname);
console.log('URL :', url);

// Atualiza o banco
const client = new pg.Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows } = await client.query('select fotos from vehicles where id = $1', [Number(idVeiculo)]);
if (!rows.length) {
  console.error('Veiculo nao encontrado:', idVeiculo);
  process.exit(1);
}
const fotos = { ...rows[0].fotos, [angulo]: url };
await client.query(
  'update vehicles set fotos = $2::jsonb, atualizado_em = now() where id = $1',
  [Number(idVeiculo), JSON.stringify(fotos)]
);
console.log('Banco atualizado (veiculo ' + idVeiculo + ', angulo ' + angulo + ')');
await client.end();
