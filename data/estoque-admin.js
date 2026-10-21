/**
 * SV Multimarcas — Carregamento do estoque no painel admin
 *
 * O admin precisa enxergar EXATAMENTE o que esta no ar. Como o site
 * publico le o banco (Neon) atraves da API, o admin tambem le
 * da API — e nao do arquivo local data/vehicles.js (que so muda
 * quando alguem faz push).
 *
 * Sem isso, o funcionario salvava a foto, voltava ao admin e a foto
 * tinha "sumido" — porque o painel ainda mostrava o seed antigo.
 */
(function (global) {
  'use strict';

  /** Busca o estoque direto do banco (sem cache do CDN). */
  async function carregar() {
    try {
      const res = await fetch('/api/veiculos', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (Array.isArray(json.veiculos) && json.veiculos.length) {
        return { veiculos: json.veiculos, origem: json.origem || 'api' };
      }
    } catch (e) {
      console.warn('[SV] API indisponivel, usando seed local:', e.message);
    }
    return { veiculos: Array.isArray(global.SV_VEHICLES) ? global.SV_VEHICLES : [], origem: 'seed' };
  }

  /** Salva o estoque no banco (Neon) e devolve a lista salva. */
  async function salvar(veiculos, mensagem) {
    const res = await fetch('/api/veiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ veiculos, mensagem })
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
  }

  global.SV_ESTOQUE_ADMIN = { carregar, salvar };
})(window);
