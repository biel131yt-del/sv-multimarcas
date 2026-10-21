/**
 * Refatora o veiculo.html para SEMPRE buscar o veiculo no banco
 * (Neon), usando o seed local apenas como fallback.
 *
 * Bug: o seed local (data/vehicles.js) so muda com push. O site
 * mostrava a versao antiga enquanto o banco ja tinha a foto nova.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');
const arquivo = resolve(raiz, 'veiculo.html');

let c = readFileSync(arquivo, 'utf8');

/* 1) VEICULOS e veiculo passam a ser mutaveis */
c = c.replace(
  "      const VEICULOS = window.SV_VEHICLES || [];\r\n" +
  "\r\n" +
  "      const params = new URLSearchParams(window.location.search);\r\n" +
  "      const id = Number(params.get('id'));\r\n" +
  "      const veiculo = VEICULOS.find(v => v.id === id);",
  "      let VEICULOS = window.SV_VEHICLES || [];\r\n" +
  "\r\n" +
  "      const params = new URLSearchParams(window.location.search);\r\n" +
  "      const id = Number(params.get('id'));\r\n" +
  "      let veiculo = VEICULOS.find(v => v.id === id);"
);

/* 2) O bloco de busca vira: seed -> banco */
const blocoAntigo =
  "      /* ---------- Veículo não encontrado no seed local ---------- */\r\n" +
  "      if (!veiculo) {\r\n" +
  "        // Pode estar no Supabase (veiculo recem-cadastrado pelo painel).\r\n" +
  "        if (window.SV_ESTOQUE) {\r\n" +
  "          window.SV_ESTOQUE.carregar(true).then(lista => {\r\n" +
  "            const v = (lista || []).find(x => x.id === id);\r\n" +
  "            if (v) {\r\n" +
  "              // Recarrega: agora o seed local ja esta atualizado pelo cache\r\n" +
  "              location.reload();\r\n" +
  "              return;\r\n" +
  "            }\r\n" +
  "            mostrarNaoEncontrado();\r\n" +
  "          }).catch(() => mostrarNaoEncontrado());\r\n" +
  "          return;\r\n" +
  "        }\r\n" +
  "        mostrarNaoEncontrado();\r\n" +
  "        return;\r\n" +
  "      }";

const blocoNovo =
  "      /* ---------- Busca o veiculo no banco (fonte da verdade) ---------- */\r\n" +
  "      // O seed local so muda com push. O banco e o que esta no ar.\r\n" +
  "      const buscarNoBanco = window.SV_ESTOQUE\r\n" +
  "        ? window.SV_ESTOQUE.carregar(true)\r\n" +
  "        : Promise.resolve(null);\r\n" +
  "\r\n" +
  "      buscarNoBanco.then(lista => {\r\n" +
  "        if (lista && lista.length) {\r\n" +
  "          VEICULOS = lista;\r\n" +
  "          const doBanco = VEICULOS.find(v => v.id === id);\r\n" +
  "          if (doBanco) {\r\n" +
  "            // Se o banco tem dados mais novos que o seed, re-renderiza\r\n" +
  "            if (!veiculo || JSON.stringify(doBanco.fotos) !== JSON.stringify(veiculo.fotos)) {\r\n" +
  "              veiculo = doBanco;\r\n" +
  "              renderizar();\r\n" +
  "            }\r\n" +
  "            return;\r\n" +
  "          }\r\n" +
  "        }\r\n" +
  "        if (!veiculo) mostrarNaoEncontrado();\r\n" +
  "      }).catch(() => {\r\n" +
  "        if (!veiculo) mostrarNaoEncontrado();\r\n" +
  "      });";

c = c.replace(blocoAntigo, blocoNovo);

/* 3) Envolve a renderizacao numa funcao */
const inicioRender = "      /* ---------- SEO dinâmico ---------- */";
c = c.replace(
  inicioRender,
  "      /* ---------- Renderizacao ---------- */\r\n" +
  "      function renderizar() {\r\n" +
  "      /* ---------- SEO dinâmico ---------- */"
);

/* 4) Fecha a funcao e chama: o seed renderiza na hora, o banco corrige depois */
const fimRender = "      /* ---------- Menu mobile ---------- */";
c = c.replace(
  fimRender,
  "      }\r\n" +
  "\r\n" +
  "      // Renderiza com o seed (instantaneo) e corrige com o banco\r\n" +
  "      if (veiculo) renderizar();\r\n" +
  "\r\n" +
  "      /* ---------- Menu mobile ---------- */"
);

writeFileSync(arquivo, c, 'utf8');
console.log('Refatorado:', arquivo);
console.log('  VEICULOS mutavel   :', c.includes('let VEICULOS ='));
console.log('  veiculo mutavel    :', c.includes('let veiculo ='));
console.log('  funcao renderizar  :', c.includes('function renderizar()'));
console.log('  busca no banco    :', c.includes('SV_ESTOQUE.carregar(true)'));
