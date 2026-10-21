/**
 * SV Multimarcas — Estoque (fonte de dados do site público)
 *
 * Ordem de resolução:
 *   1. API /api/veiculos  (Supabase ou GitHub, com cache do CDN)
 *   2. window.SV_VEHICLES (seed local em data/vehicles.js)
 *
 * O site sempre mostra algo: se a API falhar, usa o seed embutido.
 * Nenhuma requisição bloqueia a renderização inicial.
 */
(function (global) {
  'use strict';

  const LOCAL = 'local';
  const REMOTO = 'remoto';

  let cache = null;
  let carregando = null;

  /** Veículos do seed local (data/vehicles.js) */
  function seed() {
    return Array.isArray(global.SV_VEHICLES) ? global.SV_VEHICLES : [];
  }

  /** Cache em memória + sessionStorage (evita refetch a cada navegação) */
  function lerCache() {
    if (cache) return cache;
    try {
      const bruto = sessionStorage.getItem('sv_estoque');
      if (bruto) {
        const obj = JSON.parse(bruto);
        if (obj && Array.isArray(obj.veiculos) && obj.veiculos.length) {
          cache = obj;
          return cache;
        }
      }
    } catch (e) { /* storage indisponivel */ }
    return null;
  }

  function gravarCache(veiculos, origem) {
    cache = { veiculos, origem };
    try {
      sessionStorage.setItem('sv_estoque', JSON.stringify({ veiculos, origem, ts: Date.now() }));
    } catch (e) { /* quota */ }
  }

  /**
   * Devolve os veiculos. Sincrono com o cache, assincrono com a API.
   * @param {boolean} forcar  ignora o cache e busca da API
   */
  async function carregar(forcar = false) {
    if (!forcar) {
      const guardado = lerCache();
      if (guardado) return guardado.veiculos;
      return seed();
    }

    if (carregando) return carregando;

    carregando = (async () => {
      try {
        const res = await fetch('/api/veiculos', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (Array.isArray(json.veiculos) && json.veiculos.length) {
          gravarCache(json.veiculos, json.origem || REMOTO);
          return json.veiculos;
        }
        throw new Error('resposta sem veiculos');
      } catch (e) {
        console.warn('[SV] API de estoque indisponivel, usando seed local:', e.message);
        const s = seed();
        gravarCache(s, LOCAL);
        return s;
      } finally {
        carregando = null;
      }
    })();

    return carregando;
  }

  global.SV_ESTOQUE = {
    carregar,
    seed,
    /** Devolve um veiculo pelo id (do seed local) */
    porId(id) {
      const alvo = Array.isArray(global.SV_VEHICLES)
        ? global.SV_VEHICLES.find(v => v.id === Number(id))
        : null;
      return alvo || null;
    }
  };
})(window);
