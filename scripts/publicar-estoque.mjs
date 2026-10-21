/**
 * Exporta o estoque para o site.
 *
 * Fonte de verdade (em ordem):
 *   1. Banco Neon (DATABASE_URL)  -> o que esta no ar
 *   2. data/vehicles.js local   -> seed
 *
 * Gera o data/vehicles.js limpo (sem data URLs) e publica pela API.
 *
 * Uso: node scripts/publicar-estoque.mjs [url]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');
const url = process.argv[2] || 'https://sv-multimarcas.vercel.app';

const CABECALHO = `/**
 * SV Multimarcas - Fonte unica de dados do estoque
 *
 * Este e o UNICO lugar onde os veiculos sao cadastrados.
 * O site publico (index.html, veiculo.html) e o painel admin leem daqui.
 *
 * FOTOS - cada veiculo tem 3 angulos minimos:
 *   frente   -> capa do anuncio (card no estoque + topo da pagina do veiculo)
 *   interior -> 2a foto da galeria
 *   traseira -> 3a foto da galeria
 *   extras   -> fotos adicionais (opcional)
 *
 * Gerado pelo painel administrativo.
 */
`;

const PLACEHOLDER = 'images/placeholder-veiculo.svg';

/** Remove data URLs (base64) */
function limpar(fotos) {
  const s = {};
  for (const a of ['frente', 'interior', 'traseira']) {
    const v = fotos && fotos[a];
    s[a] = typeof v === 'string' && !v.startsWith('data:') ? v : PLACEHOLDER;
  }
  s.extras = Array.isArray(fotos?.extras)
    ? fotos.extras.filter(e => typeof e === 'string' && !e.startsWith('data:'))
    : [];
  return s;
}

/** Le do banco, se configurado */
async function doBanco() {
  let dsn = process.env.DATABASE_URL;
  if (!dsn) {
    const temp = process.env.TEMP || '.';
    const arq = resolve(temp, 'dsn.txt');
    if (existsSync(arq)) dsn = readFileSync(arq, 'utf8').trim();
  }
  if (!dsn) return null;

  const client = new pg.Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query('select * from vehicles order by id');
  await client.end();

  if (!rows.length) return null;

  return rows.map(r => {
    const f = limpar(r.fotos || {});
    return {
      id: Number(r.id),
      marca: r.marca,
      modelo: r.modelo,
      versao: r.versao || '',
      ano: r.ano,
      km: r.km || 0,
      cambio: r.cambio || 'Automático',
      combustivel: r.combustivel || 'Flex',
      preco: r.preco || 0,
      fotos: f,
      destaque: !!r.destaque,
      status: r.status || 'disponivel',
      descricao: r.descricao || '',
      portas: r.portas || 4,
      cor: r.cor || '',
      placa: r.placa || '',
      unicoDono: r.unico_dono || 'Sim',
      revisao: r.revisao || 'Em dia',
      checklist: r.checklist || [],
      atualizado_em: r.atualizado_em
    };
  });
}

/** Le o seed local */
function doSeed() {
  const raw = readFileSync(resolve(raiz, 'data', 'vehicles.js'), 'utf8');
  const arr = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
  return new Function('return ' + arr + ';')().map(v => ({ ...v, fotos: limpar(v.fotos) }));
}

const doBd = await doBanco();
const veiculos = doBd || doSeed();

console.log('Fonte:', doBd ? 'banco Neon' : 'seed local');
console.log('Veiculos:', veiculos.length);
veiculos.forEach(v => {
  const n = [v.fotos.frente, v.fotos.interior, v.fotos.traseira]
    .filter(f => f && f !== PLACEHOLDER).length;
  console.log(`  ${String(v.id).padStart(2)} ${v.marca} ${v.modelo} - ${n}/3 fotos - ${v.status}`);
});

// Grava o seed local limpo
const destino = resolve(raiz, 'data', 'vehicles.js');
writeFileSync(destino, CABECALHO + 'window.SV_VEHICLES = ' + JSON.stringify(veiculos, null, 2) + ';\n', 'utf8');
console.log('\nSeed local regravado (limpo):', destino);

// Publica pela API
const resp = await fetch(url + '/api/veiculos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ veiculos, mensagem: 'Atualiza o estoque publicado no site' })
});

const texto = await resp.text();
console.log('Resposta (' + resp.status + '):', texto.slice(0, 260));

if (resp.ok) {
  console.log('\nEstoque publicado. O site atualiza em instantes.');
} else {
  console.log('\nFalhou. Verifique as variaveis de ambiente.');
  process.exitCode = 1;
}
