# 📌 ESTADO DO PROJETO — ponto de continuação

> **Última atualização:** 21/10/2026 (sessão 3 — fluxo de fotos e fonte de dados corrigidos)
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
| `data/estoque.js` | Resolução no front do site público (cache CDN + sessionStorage + seed) |
| `data/estoque-admin.js` | Resolução no painel admin (**sempre no banco**, sem cache do CDN) |
| `neon-setup.sql` | **SQL completo** — tabelas, índices |

### ⚠️ REGRA DE OURO: o banco é a fonte da verdade

> **Nenhum painel e nenhuma página pública pode ler `data/vehicles.js` como
> fonte de verdade.** O seed local só muda quando alguém faz `git push`.

| Onde | Como lê |
|---|---|
| Painel admin (`admin/*.html`) | `SV_ESTOQUE_ADMIN.carregar()` → `GET /api/veiculos?t=<timestamp>` (quebra o cache do CDN) |
| Site público (`index.html`) | `SV_ESTOQUE.carregar(true)` → `GET /api/veiculos` + **sempre re-renderiza** |
| Página do veículo (`veiculo.html`) | renderiza com o seed (instantâneo) e **re-renderiza** quando o banco tem fotos diferentes |

**Bugs já corrigidos nesta família (não repetir):**
1. O admin lia o seed local → a foto "sumia" ao voltar ao painel.
2. O `index.html` só re-renderizava se a **quantidade** mudasse (9 = 9) → foto nova nunca aparecia.
3. O `veiculo.html` só buscava no banco se o veículo **não** estivesse no seed → mostrava a versão velha.
4. O preview lateral do admin rodava **antes** do `inicializar()` (que é assíncrono) → ficava vazio.
5. O HTML do painel era cacheado → o funcionário via uma versão antiga do painel.

### Estado atual
- ✅ Neon criado e conectado — `GET /api/veiculos` → `origem: "neon"`
- ✅ 9 veículos no banco
- ✅ **Vercel Blob ativo** — store `sv-multimarcas-blob` (privado)
- ✅ 3 fotos reais publicadas e servindo do Blob (Golf: frente, interior, traseira)
- ✅ Upload → Salvar → recarregar → **persiste** (validado no ar)
- ✅ Painel e site público mostram **o mesmo** estoque

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
- **Nome do blob é versionado**: `<id>-<angulo>-<versao>.<ext>` (ex.: `1-frente-mviuyltr.webp`).
  Motivo: `/api/foto` usa cache de 1 ano com `immutable` — com o nome fixo
  (`1-frente.webp`), trocar a foto **não mudava a URL** e o navegador/CDN
  continuavam servindo a foto antiga. O admin manda o caminho anterior em
  `substituir` e o servidor apaga o blob velho (campo `apagouAntigo` na resposta).
- Se o upload falhar, o slot **mantém a foto anterior** (não limpa mais)
- `scripts/limpar-blobs-orfaos.mjs` remove arquivos do Blob sem referência
  (use `--apagar` para executar)

### Scripts de linha de comando

```bash
cd scripts
node aplicar-sql.mjs          # aplica o SQL no Neon
node aguardar-deploy.mjs      # espera o deploy automatico ficar no ar
node aguardar-arquivo.mjs /data/img-variantes.js   # espera um arquivo novo subir
node medir-atualizacao.mjs    # mede quanto tempo o site leva para refletir
node limpar-foto.mjs 2 frente # remove uma foto de teste (volta ao placeholder)
node limpar-blobs-orfaos.mjs --apagar  # limpa arquivos do Blob sem uso
node publicar-estoque.mjs     # publica o estoque (le do Neon)
node sincronizar-fotos.mjs    # casa as fotos do banco com os arquivos existentes
node migrar-para-blob.mjs     # migra fotos do GitHub para o Blob
node corrigir-fotos.mjs       # repara registros com data URL
node marcar-fotos.mjs 1 images/carros/1-frente.jpg   # aponta fotos
node otimizar-imagens.mjs     # converte fotos para WebP + srcset + mapa
node gerar-mapa-variantes.mjs # gera data/img-variantes.js (quais imagens tem srcset)
node restaurar-foto.mjs       # recoloca uma foto no Blob a partir do backup
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
| **Deploy automático** | ✅ **ATIVO** — push no `main` publica sozinho | ver abaixo |
| **API /api/veiculos** | ✅ TESTADA no ar | GET → `{"ok":true,"origem":"neon","veiculos":[...]}` · POST → 200 |
| **Domínio próprio** | ⏳ Pendente | usuário não informou |

### ✅ Deploy automático (GitHub → Vercel) — RESOLVIDO

A Vercel GitHub App foi instalada na conta `biel131yt-del` e o repo foi
conectado com:

```bash
vercel git connect https://github.com/biel131yt-del/sv-multimarcas
```

Agora `git push origin main` → build → site no ar em ~60-90s.

**Como confirmar que o deploy está no ar** (evita testar a versão antiga):

```bash
cd scripts
node aguardar-deploy.mjs "/admin/veiculo-editar?id=1"
```

O script fica em loop até o middleware responder com
`next=%2Fadmin%2Fveiculo-editar%3Fid%3D1` — sinal de que a versão nova
está no ar.

> ⚠️ **Erro clássico**: testar logo após o `push` (antes do deploy terminar)
> faz o navegador carregar o HTML antigo e dar a impressão de que a
> correção não funcionou. Por isso `/admin/*` e `/login.html` agora têm
> `Cache-Control: no-store`.

### 🔑 Deploy automático (GitHub → Vercel) — ✅ RESOLVIDO

**Causa raiz que foi corrigida:** a Vercel GitHub App estava instalada na conta
GitHub `gabrielaguiar1230` (instalada em outro PC). O repo novo
`biel131yt-del/sv-multimarcas` está em **outra conta**, então o token de
instalação da Vercel não enxergava esse repo.

**Erro que aparecia:**
```
POST /v9/projects/prj_RrHH3O4uzkk1TMtXdQaoUgJqHcXT/link
→ 400 {"error":{"code":"repo_no_access",
   "message":"You need admin or write access to the repository \"sv-multimarcas\" to link it."}}
```

**Solução:** instalar a Vercel GitHub App na conta `biel131yt-del`
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
| **Upload → Salvar → recarregar** | ✅ persiste (fotos no admin = fotos no banco = fotos no site) |
| **Preview lateral do admin** | ✅ VOLKSWAGEN / Golf 2022 / R$ 149.900,00 / 100% / 8 itens |
| **Login → volta pro veículo certo** | ✅ `?id=1` preservado no redirect |
| **Cache do painel** | ✅ `Cache-Control: no-store` em `/admin/*` e `/login.html` |
| **Site público** | ✅ card do Golf com a foto real; página com 3 fotos e aviso escondido |

> `robots-txt` é o único alerta do Lighthouse e é **falso positivo**: só ocorre
> ao testar via `file://` (o `Sitemap:` aponta pro domínio de produção).

**Ferramenta de teste usada:** browser tool (preview + evaluate + lighthouse),
mediante iframe 375px para simular mobile.

---

## 🔲 Pendências (em ordem de prioridade)

1. **Fotos reais dos 9 veículos** — pelo painel: `admin/veiculos.html` →
   editar → enviar **frente, interior e traseira**. Não precisa compilar nada:
   a foto vai comprimida (WebP, 1600px) direto para o Vercel Blob.
   - Estado atual: **só o Golf (id=1) tem as 3 fotos** — e a **capa é
     provisória** (imagem de teste, não é o carro real). **Trocar pela foto
     real do Golf.** Os veículos 2 a 9 estão sem foto nenhuma.
2. **Trocar a senha do admin** e guardá-la em gerenciador de senhas
   (hoje: `Teste12345` — só para teste)
3. **Dados reais da loja** — endereço, CEP, CNPJ, link do Google Maps, e-mail
   (`admin/configuracoes.html`)
4. **Domínio próprio** (ex.: `svmultimarcas.com.br`)
5. **Termos de uso e política de cookies** (o placeholder aponta para `#`)
6. **Autenticar o MCP** — `/mcps` no OpenCode → `vercel` → sign in
7. Rodar `scripts/otimizar-imagens.mjs` se forem placed mais fotos em `images/`
   (o upload pelo painel já otimiza sozinho)

---

## 💡 Melhoria possível (decidido: **não fazer agora**)

A seção **Serviços** (`index.html`, `#servicos`) funciona, mas o usuário
achou ela "simples/estranha". Análise do que incomoda, caso queira
ajustar no futuro:

| # | Problema | Ajuste sugerido |
|---|---|---|
| A | 8 botões em 4 cards — "VER ESTOQUE" duplica o CTA do header e há **4 botões vermelhos "WHATSAPP"** (o flutuante do canto inferior direito já existe) | Deixar **1 CTA por card**; WhatsApp vira link de texto discreto ("ou chame no WhatsApp") |
| B | `.service-icon` é um quadrado de 48px com borda colorida — parece checkbox/placeholder | Ícone maior (~32px) **sem a caixa quadrada** |
| C | Todos os 4 cards têm o mesmo peso; "Troca" pesa igual a "Compra" | Card "Compra" como destaque (2 colunas, imagem do estoque), os outros 3 menores |
| D | Textos genéricos ("Consulte possibilidades para...") | Frases concretas + número real (ex.: "9 veículos disponíveis", "Avaliação grátis") |
| E | Cores alternadas sem lógica (vermelho, azul, azul, vermelho) | Definir regra: vermelho = ação principal, azul = secundária, prata = informational |

**Ordem de impacto:** A + B + D + E resolvem ~80% da sensação de "simples"
sem mexer no layout. C é o que deixa com cara de loja de verdade.

> Não implementado a pedido do usuário (21/10/2026). Os textos dos cards são
> editáveis em `admin/conteudo.html` → `data/content.js`, então dá para
> ajustar o texto sem mexer no código.

---

## 📱 Ajustes de celular (2026/10/22)

> **Regra: o PC não muda.** Tudo fica dentro de `@media (max-width: 1023px)`
> no `index.html` — que é exatamente a linha em que o site troca do layout
> de PC (`min-width: 1024px`) para o de celular/tablet. O PC (≥1024px) fica
> **idêntico** (validado: hero 900px, título 60px, badge de preço visível,
> 3 colunas, zero overflow).

### O que foi corrigido

| Problema (só no celular) | Causa | Correção |
|---|---|---|
| **Hero "zuada"** — a foto virava um borrão escuro sem o carro | O `srcset` pegava `hero-400.webp` (400×270, ratio 1.48) e o `object-fit: cover` num box 367×812 cortava quase tudo | A foto fica só no topo (228px, inteirinha) e o texto vai **embaixo**, sobre fundo sólido. A hero deixou de ocupar a tela inteira (812px → 616px) |
| **Preço aparecia 2x** no card | `.vehicle-price-badge` (sobre a foto) + `.vehicle-price` (no rodapé) | No celular, o badge sobre a foto some |
| **"Fotos pendentes" aparecia mesmo com a foto lá** | O 1º render usa o seed local (pode estar velho) e o aviso é informação errada | O aviso só aparece quando os dados vêm do **banco** (`renderEstoque(lista, doBanco)`) |
| Card mostrava placeholder sem foto | Mesma causa | Enquanto os dados não chegam, a foto fica com um **carregando** (shimmer) |
| Placeholder dizia **"Envie pelo painel admin"** | Texto interno visível ao visitante | Agora é um ícone grande com **"FOTO EM BREVE"** (afeta PC e mobile — é correção de conteúdo) |
| Demora para aparecer a foto no 4G | O seed local estava desatualizado | `data/vehicles.js` regravado com as fotos reais do banco |

### Testar mobile sem ferramenta de viewport

O browser do harness abre com ~1000px (que é o layout de celular do site).
Para ver o celular de verdade e o PC:

```js
// 375px (celular)
const f = document.createElement('iframe');
f.style.cssText = 'position:fixed;left:0;top:0;width:375px;height:812px;z-index:99999;border:0';
f.src = '/';
document.body.appendChild(f);
const m = document.createElement('style');
m.textContent = 'body>*:not(iframe){display:none!important}';
document.head.appendChild(m);

// 1440px (PC) — troque width:375px por width:1440px;height:900px
```

> `file://` **não** funciona no browser do harness (só http/https).
> Para ver o PC, use o iframe de 1440px — a janela do harness tem 1000px e
> portanto mostra o layout de celular, não o de PC.

### 📸 Cache de foto: por que a foto "não aparecia" no celular

O `/api/foto` responde com `Cache-Control: public, max-age=31536000, immutable`
(1 ano, sem revalidar). Isso é ótimo **desde que cada foto tenha uma URL nova**.

| Situação | Resultado |
|---|---|
| Foto com nome versionado (`1-frente-mviv77g6.webp`) | Cada upload gera URL nova → cache nunca atrapalha ✅ |
| Foto com nome fixo (`1-interior.webp`) e depois trocada | **Todo mundo continua vendo a foto antiga** (cache de 1 ano) ❌ |

Por isso:
- o upload gera o nome com versão: `<id>-<angulo>-<versao>.<ext>`
- `scripts/versionar-fotos.mjs` renomeia no Blob as fotos antigas que ainda
  usavam o nome fixo (usa `rename` do @vercel/blob) e atualiza o banco
- o upload também apaga o blob anterior (`substituir` no body da API)

> ⚠️ **Nunca** grave uma foto em um caminho já usado. Sempre deixe o
> upload gerar o nome com versão.

### 🐛 Campo errado: `imagens` x `fotos`

O banco usa **`fotos`** (objeto com frente/interior/traseira/extras).
O campo `imagens` **não existe** — usá-lo faz o código cair no fallback e
mostrar a imagem do hero do site no lugar da foto do carro.

> `SV.fotoCapa(veiculo)` sempre lê `fotos.frente`. Use ela em vez de
> `(v.imagens && v.imagens[0])`.

### 🏪 Dados da loja (2026/10/22)

| Dado | Valor |
|---|---|
| Endereço | Av. Ramiro Barcelos, 700 — Centro, São Jerônimo - RS, 96700-000 |
| WhatsApp | (51) 99975-4932 → `5519999754932` |
| Telefone fixo | (51) 3651-2783 → `5136512783` |
| Google Maps | link oficial da loja (em `data/config.js` → `googleMaps`) |

- O **mapa** fica na seção de Contato (`<iframe>` do Google Maps, tom
  escuro via filtro CSS). O endereço vem do painel, então se mudar lá, o
  mapa atualiza.
- A **CSP** do `vercel.json` precisou de `frame-src https://maps.google.com
  https://www.google.com` — sem isso o navegador bloqueia o iframe do mapa.
- O **schema.org** (`LocalBusiness`) do `index.html` tem o endereço e o
  telefone — é o que o Google usa para o SEO local. **Se mudar o
  endereço, tem que mudar lá também** (ou passar pelo painel, que preenche
  só a parte visual).

---

## 📁 Estrutura de arquivos

```
sv-multimarcas/
├── index.html · veiculo.html          # site público
├── api/leads.js · api/package.json    # serverless function
├── data/config.js · content.js · vehicles.js
├── data/estoque.js · estoque-admin.js # resolução do estoque (site / painel)
├── lib/ui.js
├── admin/ (6 páginas + assets/admin.css)
├── images/ (logo.png, hero.jfif, placeholder-veiculo.svg, carros/)
├── scripts/                           # utilitários de linha de comando
├── vercel.json · middleware.ts · robots.txt · sitemap.xml · .env.example
├── ABRIR SITE.bat · RODAR LOCAL.bat · INSTALAR NODE E RODAR.bat
├── README.md                           # documentação completa
└── ESTADO DO PROJETO.md                # ponto de continuação
```

---

## 🔁 Fluxo de publicação do estoque (o de verdade)

```
admin/veiculo-editar.html
   → preenche marca/modelo/preço, marca o checklist
   → envia as 3 fotos (frente, interior, traseira)
        ↓ (comprime no navegador → WebP 1600px → Vercel Blob)
   → botão "Salvar / Publicar"
        ↓ (POST /api/veiculos → Neon)
   → o site público atualiza em até 20 segundos
```

Não é mais preciso baixar `vehicles.js` nem fazer `git push` — o banco é a
fonte da verdade e o painel já mostra o que está no ar.

**Fluxo antigo (ainda existe, mas é opcional):** "Baixar vehicles.js" →
substituir em `data/vehicles.js` → `git push`. Útil só para versionar o
estoque no GitHub.

**Fluxo dos textos** (`admin/conteudo.html`) segue o caminho antigo
("Baixar content.js"), porque os textos ainda ficam em `data/content.js`.

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
