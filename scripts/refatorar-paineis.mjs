/**
 * Aplica a leitura do BANCO (Neon) nos painéis de lista e dashboard.
 * O seed local so muda quando alguem faz push — o painel precisa
 * mostrar o que esta realmente no ar.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');

/* ---------- admin/veiculos.html ---------- */
{
  const arq = resolve(raiz, 'admin', 'veiculos.html');
  let c = readFileSync(arq, 'utf8');

  c = c.replace(
    "  const VEICULOS = window.SV_VEHICLES || [];",
    "  let VEICULOS = window.SV_VEHICLES || [];"
  );

  // render() precisa rodar depois do carregar do banco
  c = c.replace(
    "  render();\n})();",
    "  await SV_ESTOQUE_ADMIN.carregar().then(({ veiculos }) => {\n" +
    "    if (veiculos && veiculos.length) {\n" +
    "      VEICULOS = veiculos;\n" +
    "      atualizarOpcoesMarca();\n" +
    "      render();\n" +
    "    }\n" +
    "  });\n" +
    "  render();\n})();"
  );

  // Helper das opcoes de marca
  c = c.replace(
    "  function statusBadge(v) {",
    "  function atualizarOpcoesMarca() {\n" +
    "    const sel = document.getElementById('filtroMarca');\n" +
    "    if (!sel) return;\n" +
    "    const marcas = [...new Set(VEICULOS.map(v => v.marca))].sort();\n" +
    "    const atual = sel.value;\n" +
    "    sel.innerHTML = '<option value=\"\">Todas as marcas</option>' +\n" +
    "      marcas.map(m => '<option value=\"' + SV.escapeHtml(m) + '\">' + SV.escapeHtml(m) + '</option>').join('');\n" +
    "    if (atual) sel.value = atual;\n" +
    "  }\n\n" +
    "  function statusBadge(v) {"
  );

  // Salvar usa o helper
  c = c.replace(
    "    const resp = await fetch('/api/veiculos', {\n" +
    "      method: 'POST',\n" +
    "      headers: { 'Content-Type': 'application/json' },\n" +
    "      body: JSON.stringify({ veiculos: VEICULOS, mensagem })\n" +
    "    });\n" +
    "    const json = await resp.json().catch(() => ({}));\n" +
    "    if (resp.ok) {",
    "    const { ok, json } = await SV_ESTOQUE_ADMIN.salvar(VEICULOS, mensagem);\n" +
    "    if (ok) {"
  );

  writeFileSync(arq, c, 'utf8');
  console.log('veiculos.html:',
    c.includes('let VEICULOS =') ? 'mutavel' : 'FALHOU',
    c.includes('SV_ESTOQUE_ADMIN.carregar()') ? '| carrega banco' : '| FALHOU',
    c.includes('SV_ESTOQUE_ADMIN.salvar(') ? '| salva helper' : '| FALHOU');
}

/* ---------- admin/index.html ---------- */
{
  const arq = resolve(raiz, 'admin', 'index.html');
  let c = readFileSync(arq, 'utf8');

  c = c.replace(
    "  const VEICULOS = window.SV_VEHICLES || [];",
    "  let VEICULOS = window.SV_VEHICLES || [];"
  );

  // Envolve a renderizacao numa funcao e carrega do banco
  c = c.replace(
    "  /* ---------- Métricas reais ---------- */",
    "  /* ---------- Métricas reais (do banco) ---------- */\n" +
    "  function renderDashboard() {"
  );

  c = c.replace(
    "  /* ---------- Contatos (banco) ---------- */",
    "  }\n\n" +
    "  /* Carrega do banco para o painel refletir o que esta no ar */\n" +
    "  (async function () {\n" +
    "    const { veiculos } = await SV_ESTOQUE_ADMIN.carregar();\n" +
    "    if (veiculos && veiculos.length) {\n" +
    "      VEICULOS = veiculos;\n" +
    "      renderDashboard();\n" +
    "    }\n" +
    "  })();\n\n" +
    "  /* ---------- Contatos (banco) ---------- */"
  );

  writeFileSync(arq, c, 'utf8');
  console.log('index.html:',
    c.includes('let VEICULOS =') ? 'mutavel' : 'FALHOU',
    c.includes('function renderDashboard()') ? '| renderDashboard' : '| FALHOU',
    c.includes('SV_ESTOQUE_ADMIN.carregar()') ? '| carrega banco' : '| FALHOU');
}
