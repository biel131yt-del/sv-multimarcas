-- ============================================================
--  SV Multimancas — Estrutura do banco (Neon / PostgreSQL)
-- ============================================================
--  Como usar:
--   1. Neon → Console → SQL Editor → New query
--   2. Cole este arquivo e clique em Run
--   3. Em Neon → Connection Details, copie a connection string
--      POOLED (a que termina em -pooler) — e a certa para serverless
--   4. Na Vercel, adicione como variavel de ambiente:
--        DATABASE_URL
--
--  Observacao sobre seguranca:
--  A connection string do Neon e PRIVADA (fica so no servidor).
--  O navegador NUNCA fala com o banco — passa pela API da Vercel.
--  Por isso nao ha RLS nem chave publica: o acesso ja e restrito
--  pela propria connection string.
-- ============================================================

-- ---------- Tabela de veiculos ----------
create table if not exists vehicles (
  id              bigint primary key,
  marca           text        not null,
  modelo          text        not null,
  versao          text,
  ano             integer     not null,
  km              integer     default 0,
  cambio          text        default 'Automático',
  combustivel     text        default 'Flex',
  preco           integer     default 0,
  fotos           jsonb       default '{}'::jsonb,
  destaque        boolean     default false,
  status          text        default 'disponivel',
  descricao       text,
  portas          integer     default 4,
  cor             text,
  placa           text,
  unico_dono      text,
  revisao         text,
  checklist       text[]      default '{}',
  atualizado_em   timestamptz default now(),
  criado_em       timestamptz default now()
);

comment on column vehicles.status is 'disponivel | reservado | vendido';
comment on column vehicles.fotos is '{"frente":"...","interior":"...","traseira":"...","extras":[]}';
comment on column vehicles.destaque is 'aparece primeiro na listagem do site';

-- ---------- Tabela de contatos ----------
create table if not exists leads (
  id          bigserial primary key,
  name        text        not null,
  phone       text        not null,
  email       text,
  vehicle     text,
  message     text,
  type        text        not null default 'interest',
  source      text        default 'site',
  created_at  timestamptz default now()
);

comment on column leads.type is 'interest | sell | trade | financing';

-- ---------- Indices ----------
create index if not exists vehicles_ano_idx     on vehicles (ano desc);
create index if not exists vehicles_marca_idx   on vehicles (marca);
create index if not exists vehicles_status_idx  on vehicles (status);
create index if not exists vehicles_destaque_idx on vehicles (destaque desc nulls last);
create index if not exists leads_created_at_idx on leads (created_at desc);

-- ============================================================
--  IMPORTAR O ESTOQUE INICIAL
-- ============================================================
--  O painel admin publica os veiculos pela API (/api/veiculos), que
--  faz upsert no banco. Para popular a primeira vez, use o botao
--  "Baixar vehicles.js" no painel e importe o arquivo, ou rode
--  os INSERT abaixo.
--
--  insert into vehicles
--    (id, marca, modelo, versao, ano, km, cambio, combustivel, preco,
--     fotos, destaque, status, descricao, portas, cor, placa,
--     unico_dono, revisao, checklist)
--  values
--    (1, 'Volkswagen', 'Golf', 'GTI', 2022, 18500, 'Automático', 'Gasolina', 149900,
--     '{"frente":"https://.../carros/1-frente.jpg","interior":"images/placeholder-veiculo.svg","traseira":"images/placeholder-veiculo.svg","extras":[]}'::jsonb,
--     true, 'disponivel', 'Hatch medio premium...', 4, 'Preto', 'Mercosul', 'Sim', 'Concessionaria',
--     array['Revisao em dia','Laudo aprovado']);
-- ============================================================
