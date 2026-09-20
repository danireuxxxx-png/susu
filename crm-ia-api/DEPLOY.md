# Colocar o IA.centrism CRM no ar

Runbook completo, do zero até o CRM aberto no navegador com dados reais.
São três peças, nesta ordem:

```
Supabase  →  API (Docker)  →  Frontend (Vercel)
 banco        crm-ia-api        crm-ia
 auth         /api/v1           VITE_API_URL aponta para a API
```

Tempo: ~30 minutos. Nada aqui depende de alterar nada pelo painel do
Supabase — o schema inteiro vem das migrations versionadas.

---

## Índice

- [Antes de começar](#antes-de-começar)
- [1. Supabase](#1-supabase)
- [2. Instalar o banco](#2-instalar-o-banco) — [pelo navegador](#a-pelo-navegador-github-actions) ou [pelo terminal](#b-pelo-terminal-um-comando)
- [3. Publicar a API](#3-publicar-a-api)
- [4. Publicar o frontend](#4-publicar-o-frontend)
- [5. Fechar o circuito (CORS)](#5-fechar-o-circuito-cors)
- [Conferência final](#conferência-final)
- [Atualizações depois do primeiro deploy](#atualizações-depois-do-primeiro-deploy)
- [Checklist de segurança](#checklist-de-segurança)
- [Quando algo dá errado](#quando-algo-dá-errado)

---

## Antes de começar

Contas necessárias (todas têm plano gratuito para começar):

| Serviço | Para quê | Plano |
|---|---|---|
| [Supabase](https://supabase.com) | Postgres + Auth + Storage | Free serve para começar |
| [Render](https://render.com) (ou Railway / Fly.io) | roda a API em container | o gratuito hiberna; ~US$ 7/mês evita isso |
| [Vercel](https://vercel.com) | serve o frontend | Hobby basta |

O passo 2 (instalar o banco) roda uma vez só, e tem dois caminhos — **escolha um**:

| Caminho | Precisa de | Bom quando |
|---|---|---|
| **A — navegador** | nada instalado; os segredos ficam no cofre do GitHub | você não quer mexer em terminal |
| **B — terminal** | Node 20.19+ e o repositório clonado | você já está com o projeto aberto |

Para o caminho B:

```bash
git clone https://github.com/danireuxxxx-png/susu.git
cd susu/crm-ia-api
npm ci
```

---

## 1. Supabase

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
   - Nome: `iacentrism-crm`
   - Região: **South America (São Paulo)** — o banco perto de quem usa
   - **Guarde a senha do banco**: ela não é exibida de novo
2. Espere o provisionamento (~2 min).
3. Colete as credenciais. São seis valores, todos do painel do projeto:

   **Project Settings → Database → Connection string**

   | Valor | Onde | Usado em |
   |---|---|---|
   | URI do **Session pooler** (porta `5432`) | aba *Session pooler* | migrations pelo GitHub ou de rede sem IPv6 |
   | URI **direta** (porta `5432`) | aba *Direct connection* | migrations da sua máquina, se ela tem IPv6 |
   | URI do **Transaction pooler** (porta `6543`) | aba *Transaction pooler* | a API em produção |

   Troque `[YOUR-PASSWORD]` pela senha do passo 1 em todas.

   Se a aba *Connection string* não aparecer, o botão **Connect**, no topo do
   projeto, abre a mesma lista.

   **Project Settings → API** (a `Project URL`) e **→ API Keys** (as chaves)

   | Valor | Onde | Observação |
   |---|---|---|
   | `Project URL` | *API* | `https://<ref>.supabase.co` |
   | `anon` / `publishable` | *API Keys* — se houver a aba *Legacy API keys*, é a `anon public` que está lá | pública, pode ir ao navegador |
   | `service_role` / `secret` | mesma página, ao lado (precisa clicar para revelar) | **ignora RLS** — só no servidor, nunca no frontend |
   | `JWT Secret` | *JWT Keys* (ou *API → JWT Settings*) | **opcional**, veja abaixo |

   > **Sobre o `JWT Secret`:** ele só serve para validar o token sem ida à rede.
   > Projetos novos assinam com chave assimétrica (ECC/RSA) e talvez nem mostrem
   > um segredo — nesse caso **deixe em branco**, que a API valida pelo Supabase.
   > Se você configurar um segredo que não corresponde à assinatura em uso, a API
   > detecta e cai para a validação pela rede em vez de recusar o login.

> Por que três: as migrations são DDL em transação, que o *Transaction pooler*
> (`6543`) não aceita — elas precisam da conexão direta ou do *Session pooler*.
> A API é o contrário: quer o `6543`, que aguenta muito mais conexões. E entre
> as duas primeiras, o *Session pooler* é o que funciona de qualquer rede: a
> conexão direta só existe em IPv6, que o GitHub Actions não tem.

---

## 2. Instalar o banco

Um passo só: aplicar as 14 migrations, criar seu usuário dono, a organização,
o funil comercial com as oito etapas e o catálogo de soluções — e conferir que
o conjunto responde. É **idempotente**: rodar de novo não duplica nada, então
não há como "instalar errado" e ter de recomeçar.

### A — pelo navegador (GitHub Actions)

Quem roda é o GitHub; os segredos ficam no cofre do repositório e nunca passam
por e-mail, chat ou pela sua máquina.

1. No repositório: **Settings → Secrets and variables → Actions → New repository secret**.
   Cadastre seis:

   | Secret | Valor (do passo 1) |
   |---|---|
   | `SUPABASE_DB_URL` | URI do **Session pooler** (porta `5432`), com a senha — a direta não funciona aqui, o GitHub não tem IPv6 |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_ANON_KEY` | chave `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` (ou `secret`) |
   | `OWNER_EMAIL` | o e-mail com que você vai entrar no CRM |
   | `OWNER_PASSWORD` | a senha que você quer usar (mínimo 8 caracteres) |

2. Aba **Actions → CRM — banco → Run workflow**
3. Em *O que fazer*, escolha **setup**, ajuste o nome da empresa e confirme.

   Antes disso, a ação **diagnostico** responde a pergunta mais comum —
   *já cadastrei tudo?* — listando cada secret como ✅ ou ❌, sem mostrar
   valor nenhum.

O log mostra cada migration aplicada, a conferência de RLS (`0 sem RLS`) e o
login funcionando de ponta a ponta. Se faltar algum segredo, o primeiro passo
para e diz qual.

> O botão *Run workflow* só aparece depois que este arquivo de workflow estiver
> no branch padrão do repositório — ou seja, depois que a PR for mesclada. Antes
> disso, o mesmo workflow roda por tag: `git tag banco-setup && git push origin
> banco-setup` dispara a instalação a partir de qualquer branch (acrescente um
> sufixo — `banco-setup-2` — para repetir uma tag já usada).

Depois, o mesmo workflow serve de manutenção: **status** lista o que já foi
aplicado e **migrate** aplica migrations novas, sem tocar em mais nada.

### B — pelo terminal (um comando)

```bash
cp .env.example .env
```

Preencha o `.env` com a connection string **direta** e as chaves do passo 1:

```ini
# Direta se sua rede tem IPv6; senão, a do Session pooler (também 5432).
DATABASE_URL=postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres
DATABASE_SSL=require
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
# Só se o projeto ainda usa o segredo JWT antigo (HS256); veja o passo 1.
SUPABASE_JWT_SECRET=
```

O `.env` está no `.gitignore` — ele não é versionado.

```bash
npm run setup
```

Ele pergunta o e-mail, a senha (que não aparece na tela), seu nome e o nome da
empresa, e faz o resto:

```
[1/4] Configuração
  ✓ banco: postgresql://***@db.<ref>.supabase.co:5432/postgres
[2/4] Schema
  ✓ conectado — PostgreSQL 17.4
  · aplicando 14 de 14 migrations
  ✓ 34 tabelas · 126 policies · 0 sem RLS
[3/4] Dono e organização
  ✓ organização criada: IA.centrism
  ✓ funil padrão criado com 8 etapas
  ✓ catálogo criado com 6 soluções
[4/4] Conferência
  ✓ login
  ✓ perfil — OWNER em IA.centrism
  ✓ cálculos financeiros respondendo
```

Se preferir os passos separados, eles continuam existindo:
`npm run migrate` (só o schema, `-- --status` para conferir) e
`npm run bootstrap` (só o dono e a organização).

### O que essa etapa garante

Cada migration roda dentro de uma transação: se uma falhar, nada dela fica pela
metade. A última confere sozinha se **toda** tabela de negócio tem RLS ligada e
falha se faltar alguma — terminar sem erro já é a prova de que o isolamento
entre organizações está de pé no banco, não só na API.

> **Ambiente de demonstração:** para ver o CRM cheio (20 empresas, 50 leads,
> 15 projetos, custos e receitas que fecham na mão), use `npm run seed` — em
> um projeto Supabase **separado**, nunca no que vai ser o seu real. O script
> se recusa a rodar com `NODE_ENV=production`, mas dados fictícios misturados
> com dados de verdade não têm volta.

---

## 3. Publicar a API

O `Dockerfile` está pronto: build em duas etapas, imagem final só com o que
roda, usuário sem privilégio e `HEALTHCHECK` em `/health`.

### Render (blueprint incluso)

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Conecte o repositório `danireuxxxx-png/susu` — o `crm-ia-api/render.yaml`
   é encontrado sozinho (runtime Docker, `rootDir: crm-ia-api`,
   health check em `/health`)
3. O Render pede as variáveis marcadas como `sync: false`. Preencha:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do **pooler** (`6543`) |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_ANON_KEY` | chave `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` |
   | `SUPABASE_JWT_SECRET` | JWT secret |
   | `CORS_ORIGINS` | deixe `http://localhost:5173` por enquanto — o domínio da Vercel entra no passo 5 |

4. **Create** e espere o build. No fim, anote a URL:
   `https://iacentrism-crm-api.onrender.com`

```bash
curl https://iacentrism-crm-api.onrender.com/health
# {"status":"ok","service":"crm-ia-api",...}
```

### Outra plataforma

Qualquer host que rode um container serve — Railway, Fly.io, Cloud Run, uma
VPS com Docker. O contrato é sempre o mesmo:

- build: o `Dockerfile` deste diretório
- porta: `PORT` (padrão `3333`), escutando em `0.0.0.0`
- health check: `GET /health`
- as mesmas variáveis de ambiente da tabela acima

Sem Docker, também funciona: `npm ci && npm run build && npm start`.

---

## 4. Publicar o frontend

1. [vercel.com/new](https://vercel.com/new) → importar `danireuxxxx-png/susu`
2. **Root Directory: `crm-ia`** (botão *Edit*) — o repositório guarda mais de
   um projeto; sem isso o build roda na raiz e falha
3. Framework *Vite* é detectado sozinho; build e saída vêm do `vercel.json`
4. **Environment Variables** → adicione:

   ```
   VITE_API_URL = https://iacentrism-crm-api.onrender.com/api/v1
   ```

   Essa variável é a chave que liga os dois modos do app: sem ela, o CRM roda
   sobre a base mockada, sem login; com ela, fala com a API de verdade e exige
   autenticação.

5. **Deploy**. Anote o domínio: `https://<projeto>.vercel.app`

> Os projetos `susu` e `susu-ncgv` que já existem na Vercel publicam os outros
> apps do repositório e falham por conta própria desde antes deste CRM existir.
> Crie um projeto novo em vez de reaproveitar um deles.

---

## 5. Fechar o circuito (CORS)

A API só aceita chamadas dos domínios que você listar. Volte ao Render →
serviço → **Environment** e ajuste:

```
CORS_ORIGINS=https://<projeto>.vercel.app,https://<seu-dominio-proprio>
```

Salve — o Render reinicia o serviço sozinho. Se for usar os *previews* da
Vercel (uma URL por push), inclua também o domínio de preview que você usar.

---

## Conferência final

Um comando confere o ambiente publicado de fora, como um usuário faria —
saúde da API, login, cálculos financeiros, site no ar e CORS liberado:

```bash
API_URL=https://iacentrism-crm-api.onrender.com \
SITE_URL=https://<projeto>.vercel.app \
OWNER_EMAIL=voce@empresa.com OWNER_PASSWORD='...' \
npm run smoke
```

Pelo navegador, é a ação **conferir** do workflow *CRM — banco* (preencha
*api_url* e *site_url*). Ele sai com erro e diz qual configuração ajustar
quando algo não responde.

<details>
<summary>Na mão, se preferir</summary>

```bash
API=https://iacentrism-crm-api.onrender.com

# 1. A API responde
curl -s $API/health

# 2. O login funciona (a senha do passo 2)
TOKEN=$(curl -s -X POST $API/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"danireuxxxx@gmail.com","password":"uma-senha-forte"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.session.accessToken')

# 3. O token abre a organização
curl -s $API/api/v1/auth/me -H "authorization: Bearer $TOKEN"

# 4. Os cálculos financeiros vêm do backend
curl -s $API/api/v1/dashboard/summary -H "authorization: Bearer $TOKEN"
```

</details>

E no navegador: abra o domínio da Vercel, entre com o e-mail e a senha do
passo 2. Um CRM recém-criado abre vazio — crie uma empresa, um lead e um
projeto com um custo para ver a margem aparecer.

---

## Atualizações depois do primeiro deploy

| Mudou | O que fazer |
|---|---|
| código da API | push no branch → Render rebuilda sozinho |
| código do frontend | push → Vercel rebuilda sozinho |
| **schema** (nova migration) | Actions → *CRM — banco* → **migrate**, ou `npm run migrate` com a connection string **direta** — *antes* de o novo código da API subir |

Nunca edite uma migration que já rodou — o `migrate` avisa quando o conteúdo
de uma aplicada mudou, e não reaplica. Crie uma nova.

---

## Checklist de segurança

- [ ] `SUPABASE_SERVICE_ROLE_KEY` existe só no ambiente da API — nunca na Vercel, nunca no repositório
- [ ] `CORS_ORIGINS` com os domínios reais, sem `*`
- [ ] `DATABASE_SSL=require` e pooler (`6543`) na API
- [ ] o passo 2 terminou sem erro e com `0 sem RLS` (é a conferência de todas as tabelas)
- [ ] `.env` fora do git (já está no `.gitignore`); pelo caminho A, nenhum segredo sai do cofre do GitHub
- [ ] Backups e PITR ligados no Supabase (**Database → Backups**)
- [ ] Senha do dono trocada se você a digitou em algum lugar compartilhado

---

## Quando algo dá errado

**`CORS policy` no console do navegador**
`CORS_ORIGINS` não tem o domínio exato da Vercel. Precisa ser igual, com
`https://` e sem barra no final.

**Login devolve 401 com a senha certa**
`SUPABASE_URL` ou `SUPABASE_ANON_KEY` errados na API — são eles que falam com
o Auth. Se o login passa mas as chamadas seguintes dão 401, o
`SUPABASE_JWT_SECRET` é que está errado.

**`/auth/me` responde, mas tudo o mais vem vazio**
O usuário não tem organização. Rode o passo 2 de novo (é idempotente).

**Migration falha com `cannot run inside a transaction block` ou a conexão cai**
Você usou o pooler (`6543`). Migrations pedem a conexão direta (`5432`).

**`ENETUNREACH` ao conectar no banco**
A conexão direta do Supabase só existe em IPv6. Se sua rede não tem IPv6 — é o
caso do GitHub Actions — use a URI do *Session pooler*: também porta `5432`,
mas com host `...pooler.supabase.com`.

**A primeira chamada do dia demora ~30s**
Plano gratuito do Render hiberna o serviço. É esperado; o plano pago resolve.

**Tudo responde, mas o app mostra dados fictícios**
`VITE_API_URL` não chegou ao build. Variável de ambiente na Vercel só vale a
partir do próximo deploy — refaça o deploy depois de adicioná-la.
