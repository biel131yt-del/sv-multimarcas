/**
 * SV Multimarcas — Helper da API do GitHub
 *
 * Usado pelas funcoes de upload e salvamento para gravar arquivos
 * diretamente no repositorio. Cada gravacao dispara o webhook de
 * deploy automatico da Vercel.
 */

const API = 'https://api.github.com';

/** Le a configuracao do repositorio das env vars */
export function config() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'biel131yt-del';
  const repo = process.env.GITHUB_REPO || 'sv-multimarcas';
  const branch = process.env.GITHUB_BRANCH || 'main';
  return { token, owner, repo, branch };
}

export function temToken() {
  return !!config().token;
}

/** Headers de autenticacao e versionamento da API do GitHub */
function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'sv-multimarcas-admin'
  };
}

/**
 * Le o conteudo (base64) de um arquivo do repositorio.
 * @returns {Promise<{content: string, sha: string}|null>} null se nao existir
 */
export async function lerArquivo(path) {
  const { token, owner, repo, branch } = config();
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
    { headers: headers(token) }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message || `GitHub ${res.status}`);
  }

  const data = await res.json();
  return { content: data.content, sha: data.sha };
}

/**
 * Cria ou atualiza um arquivo no repositorio.
 * @param {string} path  caminho do arquivo (ex.: data/vehicles.js)
 * @param {string|Buffer} conteudo  texto (utf8) ou binario da imagem
 * @param {string} mensagem  mensagem do commit
 */
export async function salvarArquivo(path, conteudo, mensagem) {
  const { token, owner, repo, branch } = config();

  let sha;
  try {
    const atual = await lerArquivo(path);
    if (atual) sha = atual.sha;
  } catch {
    sha = undefined;
  }

  const base64 = Buffer.isBuffer(conteudo)
    ? conteudo.toString('base64')
    : Buffer.from(conteudo, 'utf8').toString('base64');

  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      headers: {
        ...headers(token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: mensagem,
        content: base64,
        branch,
        ...(sha ? { sha } : {})
      })
    }
  );

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message || `GitHub ${res.status}`);
  }

  return await res.json();
}

/** Erro padronizado de resposta */
export function erro(res, status, mensagem, extra = {}) {
  return res.status(status).json({ error: mensagem, ...extra });
}
