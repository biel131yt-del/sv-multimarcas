/**
 * SV Multimarcas — Helper do banco (Neon / PostgreSQL)
 *
 * Usa a connection string do Neon (DATABASE_URL). A string e sempre
 * PRIVADA: so o servidor fala com o banco. O navegador nunca acessa
 * o PostgreSQL diretamente — o que e mais seguro que expor uma
 * chave publica com RLS.
 *
 * Quando criar o projeto no Neon, use a connection string POOLED
 * (o pooler) — e a indicada para serverless.
 *
 * Variavel de ambiente:
 *   DATABASE_URL  postgresql://user:senha@host/neondb?sslmode=require
 */

import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function config() {
  return {
    url: process.env.DATABASE_URL || '',
    ssl: process.env.DATABASE_SSL !== 'false'
  };
}

export function temBanco() {
  return !!config().url;
}

/** Pool criado sob demanda (reutilizado entre invocacoes) */
function getPool() {
  if (pool) return pool;
  const { url, ssl } = config();
  if (!url) throw new Error('DATABASE_URL nao configurada');

  pool = new Pool({
    connectionString: url,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    max: 3,            // serverless: poucas conexoes
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });

  // Evita deixar o processo pendurado por erro de conexao
  pool.on('error', (err) => {
    console.error('[db] erro de pool:', err.message);
  });

  return pool;
}

/**
 * Executa uma query.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<{rows: any[], rowCount: number}>}
 */
export async function query(sql, params = []) {
  const p = getPool();
  const res = await p.query(sql, params);
  return { rows: res.rows, rowCount: res.rowCount };
}

/**
 * Executa uma query e retorna a primeira linha.
 */
export async function queryOne(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows[0] || null;
}

/* ============================================================
   Veiculos
   ============================================================ */

/** Le todos os veiculos (publicos) */
export async function lerVeiculos() {
  const { rows } = await query(
    `select * from vehicles
      where status is distinct from 'vendido' or status is null
      order by destaque desc nulls last, id`
  );
  return rows.map(normalizarVeiculo);
}

/** Le um veiculo pelo id */
export async function lerVeiculo(id) {
  const row = await queryOne('select * from vehicles where id = $1', [id]);
  return row ? normalizarVeiculo(row) : null;
}

/**
 * Remove data URLs (base64) dos caminhos de foto.
 *
 * Um base64 de 500KB dentro do vehicles.js deixa o script do site
 * gigabytes e trava a pagina. O caminho real (images/carros/...) e
 * o que deve ser gravado — o upload ja devolve o path.
 */
function limparFotos(fotos) {
  const saida = {};
  for (const angulo of ['frente', 'interior', 'traseira']) {
    const valor = fotos && fotos[angulo];
    saida[angulo] =
      typeof valor === 'string' && !valor.startsWith('data:')
        ? valor
        : 'images/placeholder-veiculo.svg';
  }
  saida.extras = Array.isArray(fotos?.extras)
    ? fotos.extras.filter(e => typeof e === 'string' && !e.startsWith('data:'))
    : [];
  return saida;
}

/** Grava (upsert) um veiculo */
export async function salvarVeiculo(v) {
  const row = await queryOne(
    `insert into vehicles
      (id, marca, modelo, versao, ano, km, cambio, combustivel, preco,
       fotos, destaque, status, descricao, portas, cor, placa,
       unico_dono, revisao, checklist, atualizado_em)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, now())
     on conflict (id) do update set
       marca = excluded.marca,
       modelo = excluded.modelo,
       versao = excluded.versao,
       ano = excluded.ano,
       km = excluded.km,
       cambio = excluded.cambio,
       combustivel = excluded.combustivel,
       preco = excluded.preco,
       fotos = excluded.fotos,
       destaque = excluded.destaque,
       status = excluded.status,
       descricao = excluded.descricao,
       portas = excluded.portas,
       cor = excluded.cor,
       placa = excluded.placa,
       unico_dono = excluded.unico_dono,
       revisao = excluded.revisao,
       checklist = excluded.checklist,
       atualizado_em = now()
     returning *`,
    [
      v.id, v.marca, v.modelo, v.versao || null, v.ano, v.km || 0,
      v.cambio || 'Automático', v.combustivel || 'Flex', v.preco || 0,
      JSON.stringify(limparFotos(v.fotos)), !!v.destaque, v.status || 'disponivel',
      v.descricao || null, v.portas || 4, v.cor || null, v.placa || null,
      v.unicoDono || null, v.revisao || null, v.checklist || []
    ]
  );
  return row ? normalizarVeiculo(row) : null;
}

/** Remove um veiculo */
export async function removerVeiculo(id) {
  const { rowCount } = await query('delete from vehicles where id = $1', [id]);
  return rowCount > 0;
}

/** Converte a linha do banco no formato usado pelo site */
function normalizarVeiculo(row) {
  const fotos = limparFotos(row.fotos || {});
  return {
    id: Number(row.id),
    marca: row.marca,
    modelo: row.modelo,
    versao: row.versao || '',
    ano: row.ano,
    km: row.km || 0,
    cambio: row.cambio || 'Automático',
    combustivel: row.combustivel || 'Flex',
    preco: row.preco || 0,
    fotos: {
      frente: fotos.frente,
      interior: fotos.interior,
      traseira: fotos.traseira,
      extras: fotos.extras
    },
    destaque: !!row.destaque,
    status: row.status || 'disponivel',
    descricao: row.descricao || '',
    portas: row.portas || 4,
    cor: row.cor || '',
    placa: row.placa || '',
    unicoDono: row.unico_dono || 'Sim',
    revisao: row.revisao || 'Em dia',
    checklist: row.checklist || [],
    atualizado_em: row.atualizado_em
  };
}

/* ============================================================
   Contatos (leads)
   ============================================================ */

/** Le os contatos recentes */
export async function lerLeads() {
  const { rows } = await query(
    'select * from leads order by created_at desc limit 200'
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    vehicle: r.vehicle,
    message: r.message,
    type: r.type,
    source: r.source,
    created_at: r.created_at
  }));
}

/** Salva um contato */
export async function salvarLead(dados) {
  const row = await queryOne(
    `insert into leads (name, phone, email, vehicle, message, type, source, created_at)
     values ($1,$2,$3,$4,$5,$6,$7, now()) returning *`,
    [
      dados.name, dados.phone, dados.email || null, dados.vehicle || null,
      dados.message || null, dados.type || 'interest', dados.source || 'site'
    ]
  );
  return row;
}

/** Garante que as tabelas existem (cria se faltar) */
export async function garantirTabelas() {
  await query(`
    create table if not exists vehicles (
      id bigint primary key,
      marca text not null,
      modelo text not null,
      versao text,
      ano integer not null,
      km integer default 0,
      cambio text default 'Automático',
      combustivel text default 'Flex',
      preco integer default 0,
      fotos jsonb default '{}'::jsonb,
      destaque boolean default false,
      status text default 'disponivel',
      descricao text,
      portas integer default 4,
      cor text,
      placa text,
      unico_dono text,
      revisao text,
      checklist text[] default '{}',
      atualizado_em timestamptz default now(),
      criado_em timestamptz default now()
    )
  `);

  await query(`
    create table if not exists leads (
      id bigserial primary key,
      name text not null,
      phone text not null,
      email text,
      vehicle text,
      message text,
      type text not null default 'interest',
      source text default 'site',
      created_at timestamptz default now()
    )
  `);

  await query('create index if not exists vehicles_ano_idx on vehicles (ano desc)');
  await query('create index if not exists vehicles_status_idx on vehicles (status)');
  await query('create index if not exists leads_created_at_idx on leads (created_at desc)');
}
