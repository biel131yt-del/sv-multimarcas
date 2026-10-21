/**
 * Refatora o admin/veiculo-editar.html para carregar o estoque
 * do BANCO (Neon) em vez do seed local.
 *
 * O seed local (data/vehicles.js) so muda quando alguem faz push.
 * Sem isso, o funcionario salvava a foto, voltava ao painel e a
 * foto tinha "sumido" — o painel ainda mostrava o seed antigo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');
const arquivo = resolve(raiz, 'admin', 'veiculo-editar.html');

let c = readFileSync(arquivo, 'utf8');

/* 1) VEICULOS e veiculo passam a ser mutaveis */
c = c.replace(
  "  const VEICULOS = window.SV_VEHICLES || [];\r\n" +
  "  const params = new URLSearchParams(window.location.search);\r\n" +
  "  const id = Number(params.get('id'));\r\n" +
  "  const veiculo = VEICULOS.find(v => v.id === id) || null;",
  "  let VEICULOS = window.SV_VEHICLES || [];\r\n" +
  "  const params = new URLSearchParams(window.location.search);\r\n" +
  "  const id = Number(params.get('id'));\r\n" +
  "  let veiculo = VEICULOS.find(v => v.id === id) || null;"
);

/* 2) O bloco de inicializacao vira funcao */
const inicioAntigo = "  /* ---------- Modo: editar ou novo ---------- */\r\n  if (veiculo) {";
const inicioNovo =
  "  /* ---------- Modo: editar ou novo ---------- */\r\n" +
  "  function inicializar() {\r\n" +
  "   document.getElementById('countVeiculos').textContent = VEICULOS.length;\r\n" +
  "   if (veiculo) {";
c = c.replace(inicioAntigo, inicioNovo);

/* 3) Fecha a funcao e carrega do banco */
const fimAntigo =
  "    renderSlots();\r\n" +
  "    renderChecklist(veiculo.checklist || []);\r\n" +
  "  } else {\r\n" +
  "    renderSlots();\r\n" +
  "    renderChecklist(['Revisão em dia', 'Laudo aprovado', 'Pneus novos', 'Freios ok', 'IPTV quitado']);\r\n" +
  "  }";
const fimNovo =
  "    renderSlots();\r\n" +
  "    renderChecklist(veiculo.checklist || []);\r\n" +
  "   } else {\r\n" +
  "    renderSlots();\r\n" +
  "    renderChecklist(['Revisão em dia', 'Laudo aprovado', 'Pneus novos', 'Freios ok', 'IPTV quitado']);\r\n" +
  "   }\r\n" +
  "  }\r\n" +
  "\r\n" +
  "  /* Carrega o estoque do banco: o painel precisa mostrar o que esta no ar */\r\n" +
  "  (async function () {\r\n" +
  "    const { veiculos, origem } = await SV_ESTOQUE_ADMIN.carregar();\r\n" +
  "    VEICULOS = veiculos;\r\n" +
  "    veiculo = VEICULOS.find(v => v.id === id) || null;\r\n" +
  "    inicializar();\r\n" +
  "  })();";
c = c.replace(fimAntigo, fimNovo);

/* 4) Aplica o salvamento pelo helper (banco) */
c = c.replace(
  "      const resp = await fetch('/api/veiculos', {\r\n" +
  "        method: 'POST',\r\n" +
  "        headers: { 'Content-Type': 'application/json' },\r\n" +
  "        body: JSON.stringify({\r\n" +
  "          veiculos: VEICULOS,\r\n" +
  "          mensagem: (veiculo ? 'Atualiza' : 'Adiciona') + ' ' + dados.marca + ' ' + dados.modelo + ' no estoque'\r\n" +
  "        })\r\n" +
  "      });\r\n" +
  "      const json = await resp.json().catch(() => ({}));\r\n" +
  "      publicado = resp.ok;",
  "      const { ok, json } = await SV_ESTOQUE_ADMIN.salvar(\r\n" +
  "        VEICULOS,\r\n" +
  "        (veiculo ? 'Atualiza' : 'Adiciona') + ' ' + dados.marca + ' ' + dados.modelo + ' no estoque'\r\n" +
  "      );\r\n" +
  "      const resp = { ok };\r\n" +
  "      publicado = ok;"
);

writeFileSync(arquivo, c, 'utf8');
console.log('Refatorado:', arquivo);
console.log('  VEICULOS mutavel      :', c.includes('let VEICULOS ='));
console.log('  funcao inicializar()   :', c.includes('function inicializar()'));
console.log('  carrega do banco       :', c.includes('SV_ESTOQUE_ADMIN.carregar()'));
console.log('  salva via helper       :', c.includes('SV_ESTOQUE_ADMIN.salvar('));
