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
- [2. Aplicar o schema](#2-aplicar-o-schema)
- [3. Criar o dono e a organização](#3-criar-o-dono-e-a-organização)
- [4. Publicar a API](#4-publicar-a-api)
- [5. Publicar o frontend](#5-publicar-o-frontend)
- [6. Fechar o circuito (CORS)](#6-fechar-o-circuito-cors)
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

Na sua máquina: Node 20.19+ e o repositório clonado. Os passos 2 e 3 rodam
localmente uma vez só — depois disso a API sobe sozinha a cada push.

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
   | URI **direta** (porta `5432`) | aba *Direct connection* | migrations (passo 2) |
   | URI do **pooler** (porta `6543`) | aba *Transaction pooler* | a API em produção |

   Troque `[YOUR-PASSWORD]` pela senha do passo 1 nas duas.

   **Project Settings → API**

   | Valor | Observação |
   |---|---|
   | `Project URL` | `https://<ref>.supabase.co` |
   | `anon public` | pública, pode ir ao navegador |
   | `service_role` | **ignora RLS** — só no servidor, nunca no frontend |
   | `JWT Secret` (em *JWT Settings*) | valida o token sem ida à rede a cada request |

> Por que duas connection strings: a direta aceita DDL em transação (é o que
> as migrations fazem); o pooler em modo *transaction* não aceita, mas aguenta
> muito mais conexões simultâneas — que é o que a API precisa.

---

## 2. Aplicar o schema

Na sua máquina, dentro de `crm-ia-api`:

```bash
cp .env.example .env
```

Preencha o `.env` com a connection string **direta** e as chaves do passo 1:

```ini
DATABASE_URL=postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres
DATABASE_SSL=require
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
```

O `.env` está no `.gitignore` — ele não é versionado.

```bash
npm run migrate -- --status   # 14 migrations no repositório · 0 aplicadas · 14 pendentes
npm run migrate               # aplica todas, cada uma em sua transação
```

Cada migration roda dentro de uma transação: se uma falhar, nada dela fica
pela metade. Rodar de novo não repete nada — o que já passou fica registrado
em `migrations.schema_migrations`.

A última migration confere sozinha se **toda** tabela de negócio tem RLS
ligada, e falha se faltar alguma. Terminar sem erro já é a prova de que o
isolamento entre organizações está de pé no banco, não só na API.

Confira no Supabase (**Table Editor**): 34 tabelas, todas com o cadeado
*RLS enabled*.

---

## 3. Criar o dono e a organização

Ainda local, com o mesmo `.env`:

```bash
OWNER_EMAIL=danireuxxxx@gmail.com \
OWNER_PASSWORD='uma-senha-forte' \
OWNER_NAME='Danilo Reux' \
ORGANIZATION_NAME='IA.centrism' \
npm run bootstrap
```

Isso cria, de uma vez: o usuário no Supabase Auth, o perfil, a organização,
o vínculo de `OWNER`, o funil comercial com as oito etapas e o catálogo
inicial de soluções. Rodar duas vezes não duplica nada.

Essa é a senha com que você entra no CRM.

> **Ambiente de demonstração:** para ver o CRM cheio (20 empresas, 50 leads,
> 15 projetos, custos e receitas que fecham na mão), use `npm run seed` — em
> um projeto Supabase **separado**, nunca no que vai ser o seu real. O script
> se recusa a rodar com `NODE_ENV=production`, mas dados fictícios misturados
> com dados de verdade não têm volta.

---

## 4. Publicar a API

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
   | `CORS_ORIGINS` | deixe `http://localhost:5173` por enquanto — o domínio da Vercel entra no passo 6 |

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

## 5. Publicar o frontend

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

## 6. Fechar o circuito (CORS)

A API só aceita chamadas dos domínios que você listar. Volte ao Render →
serviço → **Environment** e ajuste:

```
CORS_ORIGINS=https://<projeto>.vercel.app,https://<seu-dominio-proprio>
```

Salve — o Render reinicia o serviço sozinho. Se for usar os *previews* da
Vercel (uma URL por push), inclua também o domínio de preview que você usar.

---

## Conferência final

```bash
API=https://iacentrism-crm-api.onrender.com

# 1. A API responde
curl -s $API/health

# 2. O login funciona (a senha do passo 3)
TOKEN=$(curl -s -X POST $API/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"danireuxxxx@gmail.com","password":"uma-senha-forte"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.session.accessToken')

# 3. O token abre a organização
curl -s $API/api/v1/auth/me -H "authorization: Bearer $TOKEN"

# 4. Os cálculos financeiros vêm do backend
curl -s $API/api/v1/dashboard/summary -H "authorization: Bearer $TOKEN"
```

E no navegador: abra o domínio da Vercel, entre com o e-mail e a senha do
passo 3. Um CRM recém-criado abre vazio — crie uma empresa, um lead e um
projeto com um custo para ver a margem aparecer.

---

## Atualizações depois do primeiro deploy

| Mudou | O que fazer |
|---|---|
| código da API | push no branch → Render rebuilda sozinho |
| código do frontend | push → Vercel rebuilda sozinho |
| **schema** (nova migration) | rode `npm run migrate` com a connection string **direta** *antes* de o novo código da API subir |

Nunca edite uma migration que já rodou — o `migrate` avisa quando o conteúdo
de uma aplicada mudou, e não reaplica. Crie uma nova.

---

## Checklist de segurança

- [ ] `SUPABASE_SERVICE_ROLE_KEY` existe só no ambiente da API — nunca na Vercel, nunca no repositório
- [ ] `CORS_ORIGINS` com os domínios reais, sem `*`
- [ ] `DATABASE_SSL=require` e pooler (`6543`) na API
- [ ] `npm run migrate` terminou sem erro (é a conferência de RLS de todas as tabelas)
- [ ] `.env` fora do git (já está no `.gitignore`)
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
O usuário não tem organização. Rode o passo 3 de novo (é idempotente).

**Migration falha com `cannot run inside a transaction block` ou a conexão cai**
Você usou o pooler (`6543`). Migrations pedem a conexão direta (`5432`).

**`ENETUNREACH` ao conectar no banco**
A conexão direta do Supabase é IPv6. Se sua rede não tem IPv6, use a URI do
*Session pooler* (também porta `5432`, mas com host `...pooler.supabase.com`)
para rodar as migrations.

**A primeira chamada do dia demora ~30s**
Plano gratuito do Render hiberna o serviço. É esperado; o plano pago resolve.

**Tudo responde, mas o app mostra dados fictícios**
`VITE_API_URL` não chegou ao build. Variável de ambiente na Vercel só vale a
partir do próximo deploy — refaça o deploy depois de adicioná-la.
