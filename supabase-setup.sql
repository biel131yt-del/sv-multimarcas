-- ============================================================
--  SV Multimarcas — Estrutura do banco (Supabase)
-- ============================================================
--  Como usar:
--   1. Supabase → SQL Editor → New query
--   2. Cole este arquivo inteiro e clique em Run
--   3. Copie a URL do projeto e a chave anon em Project Settings → API
--   4. Na Vercel, adicione como variáveis de ambiente:
--        SUPABASE_URL
--        SUPABASE_ANON_KEY
--        SUPABASE_SERVICE_ROLE_KEY
-- ============================================================

-- ---------- Tabela de veículos ----------
create table if not exists public.vehicles (
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

comment on column public.vehicles.status is 'disponivel | reservado | vendido';
comment on column public.vehicles.fotos is '{"frente":"...","interior":"...","traseira":"...","extras":[]}';

-- ---------- Tabela de contatos ----------
create table if not exists public.leads (
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

comment on column public.leads.type is 'interest | sell | trade | financing';

-- ---------- Indices ----------
create index if not exists vehicles_ano_idx      on public.vehicles (ano desc);
create index if not exists vehicles_marca_idx    on public.vehicles (marca);
create index if not exists vehicles_status_idx   on public.vehicles (status);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);

-- ============================================================
--  SEGURANCA (RLS)
-- ============================================================
--  Leitura publica do estoque: o site mostra os veiculos sem login.
--  Escrita: apenas a service role key (usada pelas functions da Vercel).
-- ============================================================

alter table public.vehicles enable row level security;
alter table public.leads    enable row level security;

-- Leitura anon do estoque
drop policy if exists "leitura publica do estoque" on public.vehicles;
create policy "leitura publica do estoque"
  on public.vehicles for select
  to anon, authenticated
  using (status <> 'vendido' or status is null);

-- Leitura anon dos contatos: bloqueada (so a service role acessa)
drop policy if exists "leitura anon de contatos" on public.leads;
create policy "leitura anon de contatos"
  on public.leads for select
  to anon, authenticated
  using (false);

-- ============================================================
--  STORAGE (fotos dos veiculos)
-- ============================================================
--  Cria o bucket "veiculos" com leitura publica.
--  Se ja existir, o comando apenas ignora.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('veiculos', 'veiculos', true)
on conflict (id) do nothing;

drop policy if exists "leitura publica das fotos" on storage.objects;
create policy "leitura publica das fotos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'veiculos');

-- Escrita apenas via service role (a API usa a service role key)
drop policy if exists "escrita de fotos" on storage.objects;
create policy "escrita de fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'veiculos');

-- ============================================================
--  IMPORTAR O ESTOQUE EXISTENTE
-- ============================================================
--  O painel admin publica os veiculos pela API. Para popular a
--  primeira vez, use o botao "Baixar vehicles.js" no painel e
--  depois importe o arquivo, OU rode o comando abaixo com o
--  conteudo do arquivo dentro de um array JSON.
--
--  insert into public.vehicles
--    (id, marca, modelo, versao, ano, km, cambio, combustivel, preco, fotos, destaque, status, descricao, portas, cor, placa, unico_dono, revisao, checklist)
--  values
--    (1, 'Volkswagen', 'Golf', 'GTI', 2022, 18500, 'Automático', 'Gasolina', 149900,
--     '{"frente":"images/carros/1-frente.jpg","interior":"images/placeholder-veiculo.svg","traseira":"images/placeholder-veiculo.svg","extras":[]}'::jsonb,
--     true, 'disponivel', 'Hatch médio premium...', 4, 'Preto', 'Mercosul', 'Sim', 'Concessionária',
--     array['Revisão em dia','Laudo aprovado']);
-- ============================================================
