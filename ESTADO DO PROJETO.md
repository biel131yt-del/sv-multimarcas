# 📌 ESTADO DO PROJETO — ponto de continuação

> **Última atualização:** 21/10/2026
> **Este arquivo é o ponto de partida para retomar qualquer tarefa.**

---

## 🎯 Visão do produto (ler antes de tudo)

O site da **SV Multimarcas** (loja de veículos multimarcas) tem **duas** partes:

| Parte | Finalidade | Regra de ouro |
|---|---|---|
| **Site público** (`index.html`, `veiculo.html`) | Canal **principal de divulgação** do estoque em **tempo real** | O visitante precisa ver o estoque, preço e ficha técnica **sem falar com nenhum funcionário** |
| **Painel admin** (`admin/`) | **Gerenciar o site** — publicar veículos, editar textos, ver contatos | **NÃO** é CRM, **NÃO** é sistema de vendas |

**Nenhuma venda é registrada pelo site.** O atendimento acontece no WhatsApp ou
presencialmente. Por isso o painel **não tem** ticket médio, faturamento, vendas
do mês, pipeline ou taxa de conversão — e **não deve ganhar** essas métricas,
porque o site não tem como saber esses números. Todas as métricas existentes
são reais e verificáveis.

---

## ✅ O que já está pronto e funcionando

### Site público
- `index.html` — hero, estoque com filtros (marca/ano/preço), 4 cards de serviços
  com ícones SVG, seção de confiança, form de venda/troca, form de financiamento
  com estimativa de parcela ao vivo, seção de contato, rodapé completo
- `veiculo.html` — página individual por veículo: galeria com 3 ângulos
  (frente = capa, interior, traseira), especificações, checklist, schema.org
  `Product`/`Offer`, SEO dinâmico, sticky CTA no mobile
- `data/config.js` — ⭐ fonte única dos dados da loja
- `data/content.js` — ⭐ fonte única dos textos do site (editável pelo admin)
- `data/vehicles.js` — ⭐ fonte única do estoque
- `lib/ui.js` — máscaras, validação, formatação, envio de contatos, lógica de fotos

### Painel admin (desktop)
- `admin/index.html` — visão geral: métricas reais, data da última atualização,
  progresso das fotos, distribuição por marca/preço/ano
- `admin/veiculos.html` — estoque publicado, busca, filtros, coluna de status
  das fotos, botão "Baixar vehicles.js"
- `admin/veiculo-editar.html` — 3 slots de foto por ângulo, upload, checklist
  editável, preview ao vivo, % de preenchimento, "Baixar vehicles.js"
- `admin/conteudo.html` — editor de todos os textos do site + SEO, com preview
  ao vivo e "Baixar content.js"
- `admin/leads.html` — contatos recebidos (WhatsApp/ligar direto)
- `admin/configuracoes.html` — dados da loja e conexão com o banco

### Backend
- `api/leads.js` — Vercel Function: `POST` cria contato, `GET` lista contatos
- `api/package.json` — `{ "type": "module" }` (necessário p/ ESM na function)
- Sem Supabase configurado = modo demo (valida e loga; o WhatsApp sempre abre)

---

## 🚀 Estado do deploy

| Item | Estado | Valor |
|---|---|---|
| **Site no ar** | ✅ FUNCIONANDO | https://sv-multimarcas.vercel.app |
| **Repositório GitHub** | ✅ CRIADO e com push | https://github.com/biel131yt-del/sv-multimarcas |
| **Deploy automático** | ⏳ **PENDENTE** — falta autorizar a Vercel GitHub App neste repo | ver abaixo |
| **API /api/leads** | ✅ TESTADA no ar | GET → `{"leads":[],"mensagem":"Banco de dados nao configurado."}` / POST → `{"ok":true,"salvo":false}` |
| **Domínio próprio** | ⏳ Pendente | usuário não informou |

### 🔑 Pendência: deploy automático (GitHub → Vercel)

**Causa:** a Vercel GitHub App foi instalada de **outro PC**, com seleção de
repos limited. O repo `biel131yt-del/sv-multimarcas` (novo) não está liberado.

**Erro exato:**
```
POST /v9/projects/prj_RrHH3O4uzkk1TMtXdQaoUgJqHcXT/link
→ 400 {"error":{"code":"repo_no_access",
   "message":"You need admin or write access to the repository \"sv-multimarcas\" to link it."}}
```

**Como resolver (2 opções):**

*Opção A — liberar o repo na instalação existente (mais rápido):*
1. GitHub → Settings → Applications → **Installed GitHub Apps** → **Vercel** → **Configure**
2. Em *Repository access*: **Only select repositories** → marque `sv-multimarcas`
   (ou troque para *All repositories*)
3. Salvar

*Opção B — instalar a app neste repo:*
1. Abrir https://github.com/apps/vercel/installations/new
2. Selecionar a conta `biel131yt-del` → repositório `sv-multimarcas` → Install

**Depois de resolver, rodar:**
```bash
cd "C:\Users\gabriel aguiar\OneDrive\Sv Multimarca GA PROJETOS\sv-multimarcas"
vercel git connect https://github.com/biel131yt-del/sv-multimarcas
# (responder "y")
```

**IDs úteis:**
- Project ID: `prj_RrHH3O4uzkk1TMtXdQaoUgJqHcXT`
- Project Name: `sv-multimarcas`
- Team: `team_y6bW0E3fTr4EL714ZCQ6KRIN` (GA DEV SYSTEM ACCOUNT 2)
- Alias prod: `sv-multimarcas.vercel.app`

---

## 🔧 Ambiente do PC (instalado nesta sessão)

| Ferramenta | Versão | Caminho |
|---|---|---|
| Node.js | v24.22.1 | `C:\Program Files\nodejs` (adicionado ao PATH do usuário) |
| npm / npx | 11.19.1 | idem |
| Vercel CLI | 65.0.0 | `C:\Users\gabriel aguiar\AppData\Roaming\npm\vercel.cmd` |
| GitHub CLI (gh) | 2.62.0 | `C:\Users\gabriel aguiar\AppData\Local\Programs\GitHubCLI\bin\gh.exe` |
| Git | 2.56.0 | já existia |
| opencode CLI | 2.1.1 | `C:\Users\gabriel aguiar\AppData\Roaming\ai.opencode.desktop\cli\2.1.1-x64\opencode-cli.exe` |

⚠️ **No PowerShell use `npm.cmd` / `npx.cmd`** (a Execution Policy bloqueia `.ps1`).
A Execution Policy do CurrentUser já foi ajustada para `RemoteSigned`.

**Logins ativos:**
- Vercel: `gabrielaguiardev1231-3089` (gabriel.aguiardev1231@gmail.com)
- GitHub: `biel131yt-del`
- Token do Vercel: `%APPDATA%\com.vercel.cli\Data\auth.json`

---

## 🧩 Setup do agente com Vercel (via get-started.md)

| Seção | Estado |
|---|---|
| 1. CLI instalada + autenticada | ✅ |
| 2. Guidance (plugin) | ✅ `opencode plugin add github:vercel/vercel-plugin` → todas as skills carregadas |
| 3. MCP conectado | ⏳ `opencode mcp add vercel --global --url https://mcp.vercel.com` → status **pending** |
| ↳ **falta** | Usuário rodar `/mcps` no OpenCode e autenticar o server `vercel` |

Comandos usados:
```bash
opencode plugin add github:vercel/vercel-plugin
opencode mcp add vercel --global --url https://mcp.vercel.com
```

---

## ✅ Validações feitas (não repetir)

| Teste | Resultado |
|---|---|
| Lighthouse `index.html` | Acessibilidade **1.00** · Best Practices **1.00** · SEO 0.83 |
| Lighthouse `veiculo.html` | Acessibilidade **1.00** · Best Practices **1.00** |
| Erros JS (7 páginas) | **0** |
| Mobile 375px | `scrollWidth 367` — sem overflow horizontal |
| Admin 1280px | sidebar fixa 248px, 8 colunas, 9/9 imagens |
| API no ar | GET e POST respondendo 200 |

> `robots-txt` é o único alerta do Lighthouse e é **falso positivo**: só ocorre
> ao testar via `file://` (o `Sitemap:` aponta pro domínio de produção).

**Ferramenta de teste usada:** browser tool (preview + evaluate + lighthouse),
mediante iframe 375px para simular mobile.

---

## 🔲 Pendências (em ordem de prioridade)

1. **Deploy automático** — autorizar a Vercel GitHub App (ver acima)
2. **Autenticar o MCP** — `/mcps` no OpenCode → `vercel` → sign in
3. **Fotos reais** dos 9 veículos → `images/carros/<id>-<angulo>.jpg`
   (frente, interior, traseira). README da pasta explica o padrão
4. **Autenticação do painel admin** — hoje está aberto (risco de segurança)
5. **Dados reais da loja** — endereço, CEP, CNPJ, link do Google Maps, e-mail
6. **Supabase** — criar as tabelas `vehicles` e `leads` (SQL no `README.md`),
   configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel
7. **LGPD** — política de privacidade e consentimento
8. Páginas `404.html` e `privacidade.html`
9. Domínio próprio (ex.: `svmultimarcas.com.br`)

---

## 📁 Estrutura de arquivos

```
sv-multimarcas/
├── index.html · veiculo.html          # site público
├── api/leads.js · api/package.json    # serverless function
├── data/config.js · content.js · vehicles.js
├── lib/ui.js
├── admin/ (6 páginas + assets/admin.css)
├── images/ (logo.png, hero.jfif, placeholder-veiculo.svg, carros/)
├── vercel.json · robots.txt · sitemap.xml · .env.example
├── ABRIR SITE.bat · RODAR LOCAL.bat · INSTALAR NODE E RODAR.bat
├── README.md                           # documentação completa
└── nextjs/                             # scaffolding parado (fora do git)
```

---

## 🔁 Fluxo de publicação de conteúdo (site estático)

```
admin/veiculos.html (ou veiculo-editar.html)
   → editar veículo / marcar checklist / enviar fotos
   → botão "Baixar vehicles.js"
   → substituir em data/vehicles.js
   → git add && git commit && git push
   → site atualizado (deploy automático, se o item 1 for resolvido)
```

Mesmo fluxo para `data/content.js` (textos) via `admin/conteudo.html`.

---

## 📌 Identidade visual (não alterar)

```
Preto #0B0B0D · Grafite #151518 · Branco #FFFFFF
Prata #A8ADB5 · Vermelho #E30613 · Azul #164FE5
Montserrat (títulos) · Inter (textos) · Raios 4px · Botões ≥48px
```

Regras que valem: preto é a base, branco garante leitura, prata dá
sofisticação, vermelho e azul são **apenas acentos coordenados** (nunca
competem entre si). Sem emojis. Sem efeitos exagerados. Sem sombras fortes.
