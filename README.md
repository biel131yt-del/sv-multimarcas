# SV Multimarcas — Site de Divulgação + Painel do Site

Site institucional e comercial para a **SV Multimarcas**, loja de veículos multimarcas.
Construído em HTML/CSS/JavaScript puro (sem build, sem dependências), com backend de
contatos em Vercel Serverless Functions e persistência opcional no Supabase.

---

## 🎯 Propósito do projeto

> **O site é o principal canal de divulgação do estoque.**
> O visitante precisa ver o que está disponível, com preço, ficha técnica e fotos,
> **sem precisar falar com nenhum funcionário**.
>
> O painel administrativo existe para **gerenciar o site** — publicar veículos,
> editar textos, manter dados de contato — e **não** para registrar vendas.
> Nenhuma venda é transacionada pelo site: o atendimento acontece no WhatsApp
> ou presencialmente com a equipe.

Consequência prática: **todas as métricas do painel são reais e verificáveis.**
Não existe "ticket médio", "vendas do mês" ou qualquer número que o site não
tenha como saber. Onde não há dado real, a métrica simplesmente não existe.

---

## 📊 Métricas do painel — o que é real e o que não existe

| Métrica | Fonte | Real? |
|---|---|---|
| Veículos publicados | `data/vehicles.js` | ✅ |
| Em destaque | `data/vehicles.js` | ✅ |
| Contatos recebidos | Tabela `leads` no Supabase | ✅ |
| Estoque atualizado em | `atualizado_em` de cada veículo | ✅ |
| Distribuição por marca / preço / ano | `data/vehicles.js` | ✅ |
| Fotos completas (3/3) | `data/vehicles.js` | ✅ |
| ~~Ticket médio~~ | — | ❌ **Removido**: vendas não passam pelo site |
| ~~Vendas do mês~~ | — | ❌ **Removido**: não há dado real |
| ~~Taxa de conversão~~ | — | ❌ **Removido**: exigiria analytics e CRM |

---

## 📁 Estrutura

```
sv-multimarcas/
├── index.html               # Site público (home)
├── veiculo.html             # Página individual de cada veículo
├── ABRIR SITE.bat           # Abre o site no navegador
├── RODAR LOCAL.bat          # Sobe servidor local (localhost:3000)
├── vercel.json              # Configuração de deploy + headers de segurança
├── robots.txt / sitemap.xml # SEO
│
├── data/
│   ├── config.js            # ⭐ FONTE ÚNICA dos dados da loja
│   ├── content.js           # ⭐ FONTE ÚNICA dos textos do site
│   └── vehicles.js          # ⭐ FONTE ÚNICA do estoque
│
├── lib/
│   └── ui.js                # Formatação, máscaras, validação, envio de contatos
│
├── api/
│   └── leads.js             # Vercel Function: POST cria contato / GET lista contatos
│
├── admin/                   # Painel para gerenciar o site (otimizado para desktop)
│   ├── index.html           # Visão geral do que está no ar
│   ├── veiculos.html        # Estoque publicado
│   ├── veiculo-editar.html  # Cadastro / edição com checklist
│   ├── conteudo.html        # Editor de textos de todas as seções
│   ├── leads.html           # Contatos recebidos pelos formulários
│   ├── configuracoes.html   # Dados da loja e conexão com o banco
│   └── assets/admin.css     # Estilos do painel
│
├── images/                  # Logo + fotos
│   ├── logo.png             # Logo com fundo transparente
│   ├── hero.jfif            # Foto do hero (primeira dobra)
│   ├── placeholder-veiculo.svg  # Placeholder enquanto falta foto real
│   └── carros/               # 📸 FOTOS REAIS DOS VEÍCULOS (veja o README da pasta)
│
└── nextjs/                  # Scaffolding Next.js (referência — não é usado no deploy)
```

---

## 📸 Fotos dos veículos — 3 ângulos obrigatórios

Cada veículo precisa de **3 fotos mínimas**:

| Ângulo | Função | Como aparece |
|---|---|---|
| **frente** | Capa | Topo do card no estoque e topo da página do veículo |
| **interior** | 2ª foto | Miniatura na galeria |
| **traseira** | 3ª foto | Miniatura na galeria |

**Por que esses 3?** O cliente decide se quer o carro só vendo frente, interior
e traseira. Sem interior e traseira, ele precisa perguntar — e aí o funcionário
é acionado, que é exatamente o que o site quer evitar.

### Como cadastrar

**Opção A — pelo painel (recomendado)**
1. `admin/veiculos.html` → clique no veículo
2. Na seção *Fotos do veículo*, use os 3 campos: **Frente / Interior / Traseira**
3. *Baixar vehicles.js* → substitua em `data/vehicles.js`

**Opção B — pela pasta de imagens**
1. Coloque os arquivos em `images/carros/` com o nome `<id>-<angulo>.jpg`
   (ex.: `1-frente.jpg`, `1-interior.jpg`, `1-traseira.jpg`)
2. Atualize o campo `fotos` em `data/vehicles.js` com o caminho

O painel admin detecta automaticamente se as 3 fotos existem e mostra
**"Completo"** (verde) ou **"Falta N"** (amarelo) na lista do estoque.

### Enquanto não houver foto real
- O site usa `images/placeholder-veiculo.svg` — um placeholder elegante, nunca
  uma imagem quebrada
- O card mostra o selo **"Fotos pendentes"**
- A página do veículo mostra um aviso: *"Fotos ainda não enviadas: Front, Interior,
  Traseira. Consulte a loja para ver o veículo ao vivo."*
- O painel mostra **"Falta 3"** e a barra de progresso de fotos no dashboard

Nada quebra e nada é inventado — o site funciona com fotos reais assim que
você enviá-las.

---

## 🚀 Rodar localmente

### Opção 1 — Sem instalar nada
Dê duplo clique em **`ABRIR SITE.bat`** ou no `index.html`.

### Opção 2 — Com servidor local (recomendado)
Dê duplo clique em **`RODAR LOCAL.bat`**.
- Site: `http://localhost:3000`
- Painel: `http://localhost:3000/admin/`

> O servidor local é recomendado porque permite testar a API de leads (`/api/leads`).
> Abrindo via `file://` os formulários caem automaticamente no modo WhatsApp.

---

## ⭐ Onde alterar os dados

### `data/config.js` — dados da loja
WhatsApp, telefones, e-mail, Instagram, Facebook, endereço, horário, slogan e
credenciais do Supabase. **Um único lugar, aplicado em todo o site.**

### `data/content.js` — textos do site
Todo texto editável das seções da home: hero, estoque, serviços, confiança,
formulários, contato, rodapé e metadados de SEO.
Editável pela interface em **`/admin/conteudo.html`** (com pré-visualização ao vivo).
O HTML mantém o texto padrão embutido para o Google indexar corretamente;
o JS sobrescreve com a versão editada.

### `data/vehicles.js` — estoque
Todos os veículos do site e do painel admin. Formato de cada item:

```js
{
  id: 1,
  marca: 'Volkswagen',
  modelo: 'Golf',
  versao: 'GTI',
  ano: 2022,
  km: 18500,
  cambio: 'Automático',
  combustivel: 'Gasolina',
  preco: 149900,
  fotos: {
    frente:   'images/carros/1-frente.jpg',    // CAPA do anúncio
    interior: 'images/carros/1-interior.jpg',  // 2ª foto
    traseira: 'images/carros/1-traseira.jpg',  // 3ª foto
    extras:   ['images/carros/1-detalhe1.jpg'] // opcional
  },
  destaque: true,              // aparece primeiro no estoque
  status: 'disponivel',        // disponivel | reservado | vendido
  atualizado_em: '2026-10-21T09:00:00Z',  // data exibida no site e no painel
  descricao: 'Texto de venda...',
  portas: 4,
  cor: 'Preto',
  placa: 'Mercosul',
  unicoDono: 'Sim',
  revisao: 'Concessionária',
  checklist: ['Revisão em dia', 'Laudo aprovado', 'Pneus novos']
}
```

> **`checklist`** → aparece como *"Itens verificados"* na página do veículo.
> É o que o funcionário marca para agilizar o atendimento.
>
> **`fotos`** → 3 ângulos obrigatórios (frente, interior, traseira) + extras.
> Enquanto não houver foto real, o site usa `images/placeholder-veiculo.svg`
> e sinaliza o que falta (badge no card + aviso na página). O painel mostra
> "Falta N" ou "Completo" por veículo.
>
> **`status: 'vendido'`** mantém o veículo no site (com selo) em vez de apagar o
> anúncio — isso preserva o histórico e o SEO da página.

---

## 🗄️ Banco de dados (Supabase)

Crie um projeto em [supabase.com](https://supabase.com) e execute no SQL Editor:

```sql
-- Veículos
create table if not exists vehicles (
  id bigserial primary key,
  slug text unique not null,
  brand text not null,
  model text not null,
  version text,
  year integer not null,
  km integer not null default 0,
  transmission text not null default 'Automático',
  fuel text not null default 'Flex',
  price integer not null default 0,
  images text[] default '{}',
  featured boolean default false,
  status text default 'disponivel',
  description text,
  details jsonb default '{}'::jsonb,
  checklist text[] default '{}',
  created_at timestamptz default now()
);

-- Leads
create table if not exists leads (
  id bigserial primary key,
  name text not null,
  phone text not null,
  email text,
  vehicle text,
  message text,
  type text not null default 'interest',
  source text default 'site',
  created_at timestamptz default now()
);

create index if not exists leads_created_at_idx on leads (created_at desc);
```

### Variáveis de ambiente (Vercel)

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | URL do projeto (`https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role (só no servidor) |

Sem essas variáveis o site funciona em **modo demonstração**: valida, registra no log
do servidor e abre o WhatsApp. Com elas, os leads são persistidos e aparecem em
`/admin/leads.html`.

---

## 🚀 Deploy na Vercel

1. Envie a pasta para um repositório GitHub (a pasta `nextjs/` pode ser removida antes).
2. Conecte o repositório na [Vercel](https://vercel.com).
3. Adicione as variáveis de ambiente em **Settings → Environment Variables**.
4. Deploy automático.

O `vercel.json` já define:
- Headers de segurança (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Cache longo para `/images/*`
- `cleanUrls` (URLs sem `.html`)

**Rotas amigáveis:** com `cleanUrls`, `/estoque` mapeia para `index.html#estoque`?
Não — use as âncoras já presentes no site (`/#estoque`) ou crie páginas
`estoque/index.html` se quiser URLs separadas.

---

## 🎨 Identidade visual aplicada

| Elemento | Padrão |
|---|---|
| Cores | Preto como base · branco para leitura · prata para detalhes · vermelho e azul como acentos coordenados |
| Tipografia | Montserrat (títulos) · Inter (textos e dados técnicos) |
| Raios de borda | 4px em tudo — visual técnico, não "template" |
| Espaçamentos | Escala consistente (8/16/24/40/64/88px) |
| Botões | Altura mínima 48px, `Montserrat` uppercase, sem sombra |
| Alvos de toque | Mínimo 44×44px em mobile |

---

## 📱 Mobile-first

- Layout pensado primeiro para celular (375px) e escalando com `min-width`
- `viewport-fit=cover` + `env(safe-area-inset-*)` para notch e barra de gestos
- `font-size: 16px` nos inputs → sem zoom automático no iOS
- Botão flutuante do WhatsApp respeita a safe area
- Menu mobile com trava de scroll, fecha no ESC e ao rotacionar a tela
- `aspect-ratio` nas imagens para evitar layout shift
- Sticky CTA de "Tenho interesse" na página do veículo

---

## 🖥️ Painel do site (desktop)

| Página | Função |
|---|---|
| `admin/index.html` | Visão geral: o que está no ar, KPIs reais, data da última atualização, distribuição do estoque |
| `admin/veiculos.html` | Estoque publicado: busca, filtros por marca e status, ações em linha |
| `admin/veiculo-editar.html` | Publicar/editar veículo: dados, ficha técnica, descrição, upload de fotos, checklist, preview ao vivo e % de preenchimento |
| `admin/conteudo.html` | Editar os textos de todas as seções do site + SEO, com pré-visualização ao vivo |
| `admin/leads.html` | Contatos recebidos pelos formulários, com ação direta de WhatsApp/ligar |
| `admin/configuracoes.html` | Dados da loja (WhatsApp, endereço, horários, redes) e conexão com o banco |

Layout: sidebar fixa 248px + conteúdo, sidebar vira barra horizontal no mobile.

### O que o painel **não** faz (de propósito)
- ❌ Não registra vendas, propostas, contratos ou pipeline
- ❌ Não calcula ticket médio, faturamento ou taxa de conversão
- ❌ Não substitui o sistema de vendas da revenda

Ele **publica e organiza o site**. A negociação é feita pela equipe, fora do painel.

---

## 📤 Como publicar as alterações (site estático)

O painel é uma aplicação web que roda direto no navegador. Como o site é estático,
o botão **Salvar** aplica as mudanças na sessão e o botão **Baixar arquivo** gera
o arquivo atualizado para você substituir na pasta:

| Ação no painel | Arquivo gerado | Onde substituir |
|---|---|---|
| Conteúdo do site → *Baixar arquivo* | `content.js` | `data/content.js` |
| Estoque publicado → *Baixar vehicles.js* | `vehicles.js` | `data/vehicles.js` |
| Veículo → *Baixar vehicles.js* | `vehicles.js` | `data/vehicles.js` |
| Configurações → *Salvar* | (console) | `data/config.js` |

Depois é só substituir o arquivo e recarregar o site.

**Quando o Supabase estiver conectado**, o mesmo painel passa a gravar direto
no banco (basta trocar o `console.log` por um `fetch` para a API) — os botões
continuam funcionando igual, sem mudar a interface.

---

## 🧭 Fluxo de trabalho sugerido

```
Funcionário atualiza o estoque
        ↓
admin/veiculos.html → edita ou cadastra veículo
        ↓
marca os itens verificados no checklist
        ↓
Baixar vehicles.js → substitui em data/vehicles.js
        ↓
site publica em tempo real (sem depender de ninguém)
        ↓
visitante vê o veículo, filtra e chama no WhatsApp
```

O funcionário **não precisa atender ninguém** para o estoque estar visível.
O contato é opcional — quem quer falar, chama.

---

## 🔐 Segurança

- Validação de entrada no cliente **e** no servidor (`api/leads.js`)
- Sanitização contra XSS (remoção de tags e caracteres de controle)
- `Content-Security-Policy` com `frame-ancestors 'self'`
- Service role key **apenas** no servidor (nunca no HTML)
- `robots.txt` bloqueia indexação de `/admin/` e `/api/`
- Admin sem autenticação no protótipo — **adicionar auth antes de publicar** (ver abaixo)

---

## ⚠️ Pendências antes de publicar

- [ ] Autenticação do painel admin (Supabase Auth ou Vercel Password Protection)
- [ ] Confirmar endereço, CEP e CNPJ reais
- [ ] Adicionar link real do Google Maps
- [ ] Confirmar e-mail institucional
- [ ] Política de privacidade e termos (LGPD)
- [ ] Fotos reais de cada veículo no lugar das imagens de referência
- [ ] Criar páginas `404.html` e `privacidade.html`

---

## 📊 SEO

- `schema.org` `AutomotiveBusiness` na home + `Product`/`Offer` por veículo
- Open Graph e Twitter Card dinâmicos
- `sitemap.xml` e `robots.txt`
- Filtros de estoque sincronizados com a URL (link compartilhável)
- Canonical, headings semânticos e `alt` em todas as imagens

---

## ✅ Validação realizada

| Página | Acessibilidade | Best Practices | Overflow 375px | Erros JS |
|---|---|---|---|---|
| `index.html` | **1.00** | **1.00** | não | 0 |
| `veiculo.html` | **1.00** | **1.00** | não | 0 |
| `admin/*` | 1.00 | 1.00 | — | 0 |

Testes funcionais executados no navegador:
- Estoque renderiza 9 veículos · 22 links de WhatsApp com o número correto
- Filtro por marca (BMW → 1), ano, faixa de preço · busca e ordenação
- Validação de formulário com 3 erros inline · máscara de telefone e moeda
- Estimativa: R$ 149.900 / entrada R$ 30.000 / 36x → **R$ 3.434/mês** (69% da renda)
- Envio de lead → mensagem de WhatsApp pré-preenchida com todos os dados
- `?ref=<id>` pré-preenche veículo e preço no formulário de financiamento
- Admin: busca, filtros, checklist editável, preview ao vivo, % de preenchimento
- Layout mobile 375px: `scrollWidth 367` (sem rolagem horizontal)
- Admin 1280px: sidebar fixa 248px, tabela de 8 colunas, 9/9 imagens carregadas

> O único alerta restante do Lighthouse é `robots-txt`, que só ocorre ao testar
> via `file://` (o `Sitemap:` aponta para o domínio de produção). Em produção, com
> o domínio real, a auditoria passa.

---

## 🗂️ Scripts na raiz

| Arquivo | O que faz |
|---|---|
| `ABRIR SITE.bat` | Abre o site direto no navegador (sem instalação) |
| `RODAR LOCAL.bat` | Sobe servidor em `localhost:3000` (recomendado para testar a API) |
| `INSTALAR NODE E RODAR.bat` | Instala Node.js + Vercel CLI e orienta o deploy |

---

## 📋 Pendências antes de publicar

- [ ] Autenticação do painel admin (Supabase Auth ou Vercel Password Protection)
- [ ] Confirmar endereço, CEP e CNPJ reais
- [ ] Adicionar link real do Google Maps
- [ ] Confirmar e-mail institucional
- [ ] Política de privacidade e termos (LGPD)
- [ ] **Fotos reais dos 9 veículos (3 ângulos cada)** → `images/carros/`
- [ ] Criar páginas `404.html` e `privacidade.html`
- [ ] Remover a pasta `nextjs/` (não é usada no deploy)
