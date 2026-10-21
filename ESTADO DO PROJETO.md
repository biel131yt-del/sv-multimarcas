# 📌 ESTADO DO PROJETO — ponto de continuação

> **Última atualização:** 21/10/2026 (sessão 2 — pós-deploy)
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

## 🗄️ Fonte de verdade do estoque — Neon (PostgreSQL) ✅ ATIVO

O site público lê o estoque do banco, com **fallback automático**:

```
1º  Neon (DATABASE_URL) → tabelas vehicles + leads
2º  GitHub              → Contents API (fallback, configurado)
3º  Seed local          → data/vehicles.js embutido (sempre funciona)
```

Fotos: **Vercel Blob** (prioridade) → GitHub `images/carros/` → placeholder SVG.

| Arquivo | Função |
|---|---|
| `api/_db.js` | Helper PostgreSQL (`pg`) com pool para serverless |
| `api/_blob.js` | Helper Vercel Blob |
| `api/veiculos.js` | `GET`/`POST`/`DELETE` do estoque (Neon > GitHub) |
| `api/upload.js` | Upload de foto (Blob > GitHub) |
| `api/leads.js` | Contatos gravados no Neon |
| `api/_github.js` | Fallback via Contents API do GitHub |
| `data/estoque.js` | Resolução no front (cache CDN + sessionStorage + seed) |
| `neon-setup.sql` | **SQL completo** — tabelas, índices |

### Estado atual
- ✅ Neon criado e conectado — `GET /api/veiculos` → `origem: "neon"`
- ✅ 9 veículos no banco
- ✅ **Vercel Blob ativo** — store `sv-multimarcas-blob` (privado)
- ✅ 1 foto real publicada e servindo do Blob (traseira do Golf)

### Como o Blob funciona aqui

O store é **privado** (padrão da Vercel). Isso significa:
- o blob é gravado com `access: 'private'`
- o site usa `/api/foto?pathname=carros%2F...` para exibir
- a API entrega pelo CDN com `Cache-Control: public, max-age=31536000, immutable`

Se o store for virado para **público** no dashboard, o código passa a usar a URL
diretamente (mais rápido, sem passar pela function). Ele decide sozinho.

### Para ativar o Vercel Blob
1. Vercel → projeto `sv-multimarcas` → **Storage** → `sv-multimarcas-blob` → **Tokens** → **Create Token**
2. `vercel env add BLOB_READ_WRITE_TOKEN production --value "vercel_blob_rw_..." --sensitive`
3. (opcional) `vercel blob create-store --access public` para URL direta

### Variáveis de ambiente na Vercel (status)

| Variável | Estado |
|---|---|
| `DATABASE_URL` | ✅ Neon (pooled) |
| `BLOB_STORE_ID` | ✅ (auto pela Vercel) |
| `BLOB_READ_WRITE_TOKEN` | ✅ `vercel_blob_rw_...` |
| `ADMIN_PASSWORD` | ✅ `Teste12345` |
| `ADMIN_SECRET` | ✅ assinatura do cookie |
| `GITHUB_TOKEN` | ✅ fallback — **trocar por token dedicado** |
| `GITHUB_OWNER` / `GITHUB_REPO` | ✅ |

### ⚠️ Detalhes técnicos do Blob (não repetir)

- `@vercel/blob` **precisa ser 1.x**: a 0.27 rejeita os dois modos de acesso
  (`public` em store privado e `private` com "access must be public")
- O `get()` da 1.x devolve um `ReadableStream` **web**: converter com
  `Buffer.from(await new Response(stream).arrayBuffer())` — `res.end(stream)` não funciona no runtime Node
- `srcset` deve ignorar URLs de API (não têm variantes locais)

### Scripts de linha de comando

```bash
cd scripts
node aplicar-sql.mjs          # aplica o SQL no Neon
node publicar-estoque.mjs     # publica o estoque (le do Neon)
node sincronizar-fotos.mjs    # casa as fotos do banco com os arquivos existentes
node migrar-para-blob.mjs     # migra fotos do GitHub para o Blob
node corrigir-fotos.mjs       # repara registros com data URL
node marcar-fotos.mjs 1 images/carros/1-frente.jpg   # aponta fotos
node otimizar-imagens.mjs     # converte fotos para WebP + srcset
node testar-publicacao.mjs    # valida o payload
node testar-auth.mjs          # testa o login localmente
```

> ⚠️ **Nunca** use `Set-Content -Encoding UTF8` do PowerShell 5.1 para editar
> arquivos do projeto: **corrompe acentos**. Use `[System.IO.File]::ReadAllText/
> WriteAllText` com UTF8 explícito, o VS Code, ou os scripts Node.

---

## 🔐 Acesso ao painel (NOVO nesta sessão)

O painel **agora exige senha**. Implementado com Routing Middleware da Vercel
(sem dependências):

| Arquivo | Função |
|---|---|
| `middleware.ts` | Intercepta `/admin/*` antes do cache. Valida o cookie `sv_admin` (HMAC SHA-256). Runtime Node.js. |
| `api/login.js` | Confere a senha contra `ADMIN_PASSWORD` **no servidor** e assina o cookie. `POST /api/login` e `POST /api/logout`. |
| `login.html` | Tela de acesso. Redireciona para `?next=` ao entrar. |

**Variáveis de ambiente (já configuradas na Vercel, secret):**
- `ADMIN_PASSWORD` — senha de acesso
- `ADMIN_SECRET` — segredo da assinatura do cookie

> ⚠️ A senha está no arquivo `%TEMP%\sv_admin_senha.txt` **neste PC**.
> **Troque-a em produção** e salve no gerenciador de senhas.
> Sem `ADMIN_PASSWORD`, o painel fica **bloqueado** (falha segura) e
> `/admin` mostra "Painel nao configurado" (HTTP 503).

**Cookie de sessão:** `sv_admin`, 12h, `HttpOnly` + `Secure` + `SameSite=Lax`.

---

## 🖼️ Otimização de imagens (NOVO nesta sessão)

Todas as fotos foram convertidas para **WebP** com variantes responsivas:

| Antes | Depois |
|---|---|
| `hero.jfif` 83KB | `hero.webp` 63KB + `-400/-800/-1200` |
| `referencia1.jfif` 196KB | `referencia1.webp` 155KB + variantes |
| `referencia2.jfif` 118KB | `referencia2.webp` 70KB + variantes |
| `logo.png` 18KB | `logo.webp` 4KB (PNG mantido p/ favicon) |
| **Total 431KB** | **295KB (-32%)** |

O `srcset` está aplicado no hero (`index.html`) e na galeria (`veiculo.html`).
`lib/ui.js` expõe `SV.srcset(src)`.

**Para as fotos reais chegarem:**
```bash
cd scripts
npm install
node otimizar-imagens.mjs    # converte o que estiver em ../images/
```

> ⚠️ **NUNCA** editar os arquivos do site com `Set-Content` do PowerShell 5.1
> (`-Encoding UTF8`): isso **corrompe acentos**. Use
> `[System.IO.File]::ReadAllText/WriteAllText` com UTF8 explícito, ou a
> ferramenta de edição. Já aconteceu e o git foi usado para reverter.

---

## 📄 Páginas legais (NOVO nesta sessão)

- `404.html` — página de erro, detectada automaticamente pela Vercel
- `privacidade.html` — Política de Privacidade LGPD, linkada no rodapé

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
- `api/login.js` — autenticação do painel (senha no servidor)
- `api/package.json` — `{ "type": "module" }` (necessário p/ ESM na function)
- Sem Supabase configurado = modo demo (valida e loga; o WhatsApp sempre abre)

### Ferramentas
- `scripts/otimizar-imagens.mjs` — converte para WebP + gera srcset
- `scripts/testar-auth.mjs` — testa o fluxo de login localmente (sem deploy)

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

**Causa raiz:** a Vercel GitHub App está instalada na conta GitHub
`gabrielaguiar1230` (instalada em outro PC). O repo novo
`biel131yt-del/sv-multimarcas` está em **outra conta**, então o token de
instalação da Vercel não enxerga esse repo.

**Erro exato:**
```
POST /v9/projects/prj_RrHH3O4uzkk1TMtXdQaoUgJqHcXT/link
→ 400 {"error":{"code":"repo_no_access",
   "message":"You need admin or write access to the repository \"sv-multimarcas\" to link it."}}
```

**Solução (2 cliques):** instalar a Vercel GitHub App na conta `biel131yt-del`
→ https://github.com/apps/vercel/installations/new
→ *Install on* → **biel131yt-del** → *All repositories* → **Install**

Depois: `vercel git connect https://github.com/biel131yt-del/sv-multimarcas`

**Alternativa que já funciona:** `PUBLICAR.bat` (commit + push + deploy em
1 comando, ~30s). Não depende do link automático.

**Contas deste ambiente:**
- GitHub CLI: `biel131yt-del` (repo do projeto)
- Vercel: `gabrielaguiardev1231@gmail.com` → team `ga-dev-system-account-2`
- Vercel GitHub App: instalada em `gabrielaguiar1230` (PC anterior)

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

1. **Deploy automático** — autorizar a Vercel GitHub App no repo (ver acima)
2. **Trocar a senha do admin** e guardá-la em gerenciador de senhas
3. **Autenticar o MCP** — `/mcps` no OpenCode → `vercel` → sign in
4. **Fotos reais** dos 9 veículos → `images/carros/<id>-<angulo>.jpg`
   (frente, interior, traseira) e rodar `scripts/otimizar-imagens.mjs`
5. **Dados reais da loja** — endereço, CEP, CNPJ, link do Google Maps, e-mail
6. **Supabase** — criar as tabelas `vehicles` e `leads` (SQL no `README.md`),
   configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel
7. **Domínio próprio** (ex.: `svmultimarcas.com.br`)
8. Termos de uso e política de cookies (o placeholder aponta para `#`)

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
