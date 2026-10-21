/**
 * SV Multimarcas — Helper do Supabase
 *
 * Usado pelas functions para ler/gravar o estoque e subir as fotos.
 * Sem credenciais configuradas, o sistema cai automaticamente no
 * modo GitHub (fallback) — nada quebra.
 *
 * Variaveis de ambiente:
 *   SUPABASE_URL              https://xxx.supabase.co
 *   SUPABASE_ANON_KEY        chave anon (leitura, va no front)
 *   SUPABASE_SERVICE_ROLE_KEY chave de service role (escrita, so no servidor)
 */

const TABELA_VEICULOS = 'vehicles';
const BUCKET = 'veiculos';

export function config() {
  return {
    url: process.env.SUPABASE_URL || '',
    anon: process.env.SUPABASE_ANON_KEY || '',
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };
}

/** True quando ha Supabase configurado com chave de escrita */
export function temSupabase() {
  const { url, service } = config();
  return !!(url && service);
}

/** Headers da API do Supabase (PostgREST / Storage) */
function headers(chave) {
  return {
    apikey: chave,
    Authorization: `Bearer ${chave}`,
    'Content-Type': 'application/json'
  };
}

/** Chave a usar: service role (escrita) ou anon (leitura) */
function chave(praEscrita = true) {
  const { service, anon } = config();
  return praEscrita && service ? service : anon;
}

/**
 * Le todos os veiculos do banco.
 * @returns {Promise<Array|null>} null se nao houver Supabase ou der erro
 */
export async function lerVeiculos() {
  const { url } = config();
  if (!url) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/${TABELA_VEICULOS}?select=*&order=id`,
      { headers: headers(chave(false)) }
    );
    if (!res.ok) return null;

    const dados = await res.json();
    if (!Array.isArray(dados) || !dados.length) return null;

    return dados.map(normalizar);
  } catch (e) {
    console.warn('[supabase] erro ao ler veiculos:', e.message);
    return null;
  }
}

/** Converte a linha do banco no formato usado pelo site */
function normalizar(linha) {
  const fotos = linha.fotos || {};
  return {
    id: linha.id,
    marca: linha.marca,
    modelo: linha.modelo,
    versao: linha.versao || '',
    ano: linha.ano,
    km: linha.km || 0,
    cambio: linha.cambio || 'Automático',
    combustivel: linha.combustivel || 'Flex',
    preco: linha.preco || 0,
    fotos: {
      frente: fotos.frente || 'images/placeholder-veiculo.svg',
      interior: fotos.interior || 'images/placeholder-veiculo.svg',
      traseira: fotos.traseira || 'images/placeholder-veiculo.svg',
      extras: fotos.extras || []
    },
    destaque: !!linha.destaque,
    status: linha.status || 'disponivel',
    descricao: linha.descricao || '',
    portas: linha.portas || 4,
    cor: linha.cor || '',
    placa: linha.placa || '',
    unicoDono: linha.unicoDono || 'Sim',
    revisao: linha.revisao || 'Em dia',
    checklist: linha.checklist || [],
    atualizado_em: linha.atualizado_em || linha.created_at
  };
}

/**
 * Grava (upsert) um veiculo no banco.
 * @param {object} veiculo
 */
export async function salvarVeiculo(veiculo) {
  const { url } = config();
  const linha = {
    id: veiculo.id,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    versao: veiculo.versao || null,
    ano: veiculo.ano,
    km: veiculo.km || 0,
    cambio: veiculo.cambio,
    combustivel: veiculo.combustivel,
    preco: veiculo.preco || 0,
    fotos: veiculo.fotos || {},
    destaque: !!veiculo.destaque,
    status: veiculo.status || 'disponivel',
    descricao: veiculo.descricao || null,
    portas: veiculo.portas || 4,
    cor: veiculo.cor || null,
    placa: veiculo.placa || null,
    unicoDono: veiculo.unicoDono || null,
    revisao: veiculo.revisao || null,
    checklist: veiculo.checklist || [],
    atualizado_em: new Date().toISOString()
  };

  const res = await fetch(
    `${url}/rest/v1/${TABELA_VEICULOS}?on_conflict=id`,
    {
      method: 'POST',
      headers: {
        ...headers(chave(true)),
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(linha)
    }
  );

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message || `Supabase ${res.status}`);
  }

  return linha;
}

/**
 * Remove um veiculo do banco.
 */
export async function removerVeiculo(id) {
  const { url } = config();
  const res = await fetch(
    `${url}/rest/v1/${TABELA_VEICULOS}?id=eq.${id}`,
    { method: 'DELETE', headers: headers(chave(true)) }
  );
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message || `Supabase ${res.status}`);
  }
}

/**
 * Sobe uma imagem para o Storage do Supabase.
 * @param {Buffer} binario
 * @param {string} nome  nome do arquivo
 * @param {string} tipo  mime type
 * @returns {Promise<string>} URL publica do arquivo
 */
export async function subirFoto(binario, nome, tipo) {
  const { url } = config();

  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${encodeURIComponent(nome)}`,
    {
      method: 'POST',
      headers: {
        apikey: chave(true),
        Authorization: `Bearer ${chave(true)}`,
        'Content-Type': tipo || 'image/jpeg',
        'x-upsert': 'true'
      },
      body: binario
    }
  );

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message || `Supabase Storage ${res.status}`);
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(nome)}`;
}

/**
 * Le os contatos (leads) do banco.
 */
export async function lerLeads() {
  const { url } = config();
  if (!url) return [];

  try {
    const res = await fetch(
      `${url}/rest/v1/leads?select=*&order=created_at.desc&limit=200`,
      { headers: headers(chave(false)) }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Salva um contato (lead).
 */
export async function salvarLead(dados) {
  const { url } = config();
  const res = await fetch(`${url}/rest/v1/leads`, {
    method: 'POST',
    headers: headers(chave(true)),
    body: JSON.stringify(dados)
  });
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message || `Supabase ${res.status}`);
  }
}
