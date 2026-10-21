/**
 * Aplica o SQL de estrutura no banco (Neon/PostgreSQL).
 *
 * Uso: node scripts/aplicar-sql.mjs
 * A connection string vem da variavel DATABASE_URL ou do arquivo
 * %TEMP%\dsn.txt (criado durante a configuracao).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');

// 1) Variavel de ambiente
let dsn = process.env.DATABASE_URL;

// 2) Arquivo de configuracao local (fallback)
if (!dsn) {
  try {
    const temp = process.env.TEMP || process.env.TMP || '.';
    dsn = readFileSync(resolve(temp, 'dsn.txt'), 'utf8').trim();
  } catch { /* sem arquivo */ }
}

if (!dsn) {
  console.error('DATABASE_URL nao encontrada. Configure a variavel de ambiente.');
  process.exit(1);
}

const sql = readFileSync(resolve(raiz, 'neon-setup.sql'), 'utf8');

// Remove linhas de comentario (-- ...) e blocos /* ... */
const limpo = sql
  .split('\n')
  .filter(linha => !linha.trim().startsWith('--'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

// Divide por ; respeitando o SQL
const comandos = limpo
  .split(';')
  .map(c => c.trim())
  .filter(c => c && c.length > 0);

const client = new Client({
  connectionString: dsn,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
console.log('Conectado ao banco.\n');

for (const cmd of comandos) {
  const nome = cmd.split('\n')[0].slice(0, 60);
  try {
    await client.query(cmd);
    console.log('  OK  ', nome);
  } catch (e) {
    console.log('  ERRO', nome, '->', e.message);
  }
}

// Confere o resultado
const tabelas = await client.query(
  "select table_name from information_schema.tables where table_schema='public' order by table_name"
);
console.log('\nTabelas:', tabelas.rows.map(t => t.table_name).join(', ') || 'nenhuma');

const cont = await client.query('select count(*)::int as total from vehicles').catch(() => null);
if (cont) console.log('Veículos na tabela:', cont.rows[0].total);

await client.end();
console.log('\nPronto.');
