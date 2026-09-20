# IA.centrism CRM — API

Backend do CRM: multi-tenant, autenticado pelo Supabase, com o Postgres do
Supabase como fonte única de dados e um motor de **unit economics** que responde,
direto dos dados, perguntas como *"quanto custa manter este cliente?"* e *"qual
projeto dele tem a pior margem?"*.

Nesta etapa **não há agentes de IA nem integração com WhatsApp** — só a fundação
de dados, CRM, projetos, custos, rentabilidade e as tabelas preparadas para essas
automações entrarem depois.

---

## Índice

- [Arquitetura](#arquitetura)
- [Como os números são calculados](#como-os-números-são-calculados)
- [Segurança](#segurança)
- [Desenvolvimento local](#desenvolvimento-local)
- [Banco: migrations e seed](#banco-migrations-e-seed)
- [API](#api)
- [Testes](#testes)
- [Produção](#produção)
- [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Arquitetura

Monólito modular em TypeScript sobre Fastify, com Supabase por baixo:

```
HTTP  →  Fastify (validação Zod, papel, rate limit)
      →  withUser(): abre transação, injeta o JWT e troca para o papel `authenticated`
      →  PostgreSQL do Supabase (RLS decide o que a query enxerga)
```

```
src/
  env.ts              configuração validada na inicialização
  app.ts              plugins, tratamento de erro, montagem das rotas
  lib/
    db.ts             pool + contexto de RLS por requisição
    supabase.ts       clientes do Supabase Auth (anon e admin)
    jwt.ts            verificação local do token (HS256), sem ida à rede
    resource.ts       fábrica do CRUD padrão (lista, filtros, paginação, soft delete)
    query.ts          montagem de SQL com lista branca de colunas
    errors.ts         erros de aplicação e tradução dos erros do Postgres
  plugins/
    auth.ts           autenticação, organização da requisição e checagem de papel
    audit.ts          auditoria de login, logout e troca de permissão
  modules/            rotas por domínio (crm, delivery, financial, engagement, dashboard)
supabase/
  migrations/         schema versionado (tabelas, índices, funções, views, RLS, storage)
  seed.sql            base de desenvolvimento com números conferíveis à mão
```

### Por que SQL direto e não só o client do Supabase

O Supabase cuida de **identidade e arquivos** — é o que ele faz melhor, e é assim
que o projeto o usa (`@supabase/supabase-js` em `lib/supabase.ts`). Os **dados**
passam por SQL direto (`postgres.js`) porque o CRM precisa de três coisas que o
PostgREST não entrega bem:

1. **transações** de verdade (converter lead toca 4 tabelas e precisa ser atômico);
2. **agregações financeiras** em uma consulta, sem N+1;
3. **testes** rodando contra um Postgres real, sem depender de Docker.

O ponto que costuma preocupar nessa escolha — perder o RLS — não se aplica:
`withUser()` faz exatamente o que o PostgREST faz (injeta `request.jwt.claims` e
troca para o papel `authenticated`), então **toda query continua passando pelo
RLS**. Nenhuma consulta de tenant roda com privilégio elevado.

---

## Como os números são calculados

Regras oficiais, implementadas em `supabase/migrations/...economics.sql`. A API
nunca recalcula por fora, e o frontend nunca soma nada por conta própria.

| Conceito | Regra |
|---|---|
| **Receita recorrente (MRR)** | soma de `projects.monthly_revenue` dos projetos `ACTIVE` |
| **Custo do projeto** | soma dos custos vigentes no mês, normalizados para base mensal |
| **Custo efetivo de uma linha** | `actual_monthly_cost` → `estimated_monthly_cost` → `unit_cost × consumo` → valor normalizado pelo período |
| **Normalização** | anual ÷ 12, trimestral ÷ 3, semanal × 52/12… e **ONE_TIME = 0** (pontual não é recorrência) |
| **Vigência** | o custo conta se `[start_date, end_date]` intersecta o mês de referência |
| **Lucro** | receita − (custo direto + custo rateado) |
| **Margem** | lucro ÷ receita × 100, e **0 quando não há receita** (nunca divide por zero) |
| **Lucro bruto da operação** | MRR − custo dos projetos |
| **Lucro líquido** | lucro bruto − despesas da organização |

Duas fontes de receita convivem, de propósito:

- `projects.monthly_revenue` — o que está **contratado** (é o MRR);
- `revenues` — o que foi **faturado/recebido** (é o caixa, com competência, vencimento e status).

Misturar as duas é o erro clássico desse tipo de sistema; os relatórios tratam
cada uma no seu papel.

Um projeto em `ONBOARDING` **custa antes de faturar** — e o relatório mostra isso
com margem negativa, porque é a verdade da operação.

---

## Segurança

| Camada | O que garante |
|---|---|
| **RLS em todas as 34 tabelas** | uma query só enxerga linhas da organização do usuário. A última migration **falha** se alguma tabela ficar sem RLS |
| **Policies por papel** | OWNER/ADMIN tudo; MANAGER entrega; SALES comercial; FINANCE financeiro; VIEWER só leitura |
| **Views com `security_invoker`** | sem isso uma view roda com o privilégio do dono e **ignora o RLS** — furo clássico de multi-tenant |
| **Funções `SECURITY DEFINER`** | só onde é inevitável (helpers de tenancy, criação de organização, auditoria), sempre com `search_path` fixo e checagem de papel dentro |
| **`organization_id` nunca vem do cliente** | é sempre o da sessão; forjar no corpo da requisição não tem efeito (há teste para isso) |
| **404 em vez de 403 entre tenants** | a resposta não confirma que um registro existe em outra organização |
| **Auditoria append-only** | trigger registra o *delta* de cada mudança; ninguém edita nem apaga a trilha |
| **Segredos** | `service_role` só no servidor; credenciais de integração guardam **referência** a um secret manager, nunca a chave |
| **Borda HTTP** | Helmet, CORS por lista, rate limit por usuário, corpo limitado, validação Zod, logs com `authorization` e senha redigidos |

---

## Desenvolvimento local

Não é preciso Docker nem conta no Supabase para rodar e testar:

```bash
npm install
cp .env.example .env     # DATABASE_URL local + DATABASE_SSL=disable

# Terminal 1 — Postgres local (PGlite) com migrations e seed aplicados
npm run db:local
#   → postgres://postgres:postgres@127.0.0.1:5433/postgres

# Terminal 2 — API
npm run dev
#   → http://localhost:3333  (health: /health)
```

Com o Supabase CLI instalado, o caminho oficial também funciona:

```bash
supabase start      # sobe Postgres, Auth, Storage e Studio
supabase db reset   # aplica supabase/migrations + supabase/seed.sql
npm run seed        # cria os usuários de desenvolvimento pela Admin API
```

---

## Banco: migrations e seed

Tudo é versionado em `supabase/migrations` — nenhuma alteração depende do painel.

| Migration | Conteúdo |
|---|---|
| `…000100_init_types_and_helpers` | enums, `to_monthly_amount`, `is_active_in_month`, `safe_margin` |
| `…000200_tenancy` | organizações, perfis, membros, helpers de RLS, `create_organization` |
| `…000300_crm` | empresas, contatos, leads, pipelines, etapas, oportunidades, histórico |
| `…000400_delivery_and_costs` | produtos, projetos, serviços, **custos**, histórico de custo, consumo, rateio |
| `…000500_finance` | receitas faturadas e despesas da operação |
| `…000600_engagement` | atividades, interações, insights, metas, notificações, jornal matinal |
| `…000700_audit` | trilha de auditoria e trigger de delta |
| `…000800_future_integrations` | integrações, webhooks, mensagens e tabelas de IA (**sem implementação**) |
| `…000900_economics` | views e funções de custo, lucro, margem e rentabilidade |
| `…001000_operations` | operações transacionais (converter lead, mover etapa, venda → projeto) |
| `…001100_rls` | RLS e policies de todas as tabelas + conferência automática |
| `…001200_storage` | buckets e policies do Supabase Storage |
| `…001300_goal_progress` | metas com o realizado calculado dos dados |

O seed cria 1 organização (+1 para provar isolamento), 6 usuários, 20 empresas,
30 contatos, 50 leads, 30 oportunidades, **15 projetos em 10 clientes**, 41 linhas
de custo, 85 receitas, 6 despesas, 45 atividades e 6 metas — com números que fecham
na mão:

```
Alpha Imóveis
  Agente Comercial IA   8.000   custo   560   (OpenAI 280 · VPS 120 · Supabase 50 · WhatsApp 90 · Storage 20)
  Automação de CRM      4.000   custo   740
  Suporte IA pós-venda  3.000   custo   200
  ────────────────────────────────────────────
  receita 15.000 · custo 1.500 · lucro 13.500 · margem 90%

Operação
  MRR 72.900 · ARR 874.800
  custo de projetos 8.180 · operação 37.900
  lucro bruto 64.720 (88,8%) · lucro líquido 26.820 (36,8%)
```

O próprio `seed.sql` verifica esses totais no final e **falha** se algum não bater.

---

## API

Base: `/api/v1`. Autenticação: `Authorization: Bearer <access_token>`.
Organização: `x-organization-id` (opcional quando o usuário pertence a uma só).

Toda listagem aceita `?page=1&limit=20&sort=campo&direction=desc&search=texto` e
devolve:

```json
{ "data": [], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

Filtros conforme o recurso: `status`, `ownerId`, `companyId`, `projectId`,
`pipelineId`, `stageId`, `category`, `provider`, `type`, `source`, `priority`,
`dateFrom`, `dateTo`, `minValue`, `maxValue`.

### Autenticação e organização

| Método | Rota |
|---|---|
| `POST` | `/auth/login` · `/auth/refresh` · `/auth/logout` · `/auth/password-recovery` |
| `GET` `PATCH` | `/auth/me` |
| `POST` | `/auth/organizations` |
| `GET` `PATCH` | `/organizations/current` |
| `GET` `POST` `PATCH` `DELETE` | `/organizations/current/members` |

### CRM

`companies` · `contacts` · `leads` · `opportunities` · `pipelines` ·
`pipeline-stages` — CRUD completo, mais:

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/leads/:id/convert` | lead → oportunidade + histórico + atividade (transacional) |
| `POST` | `/opportunities/:id/stage` | move de etapa, ajusta probabilidade e marca ganho/perda |
| `GET` | `/opportunities/:id/history` | trilha de passagem pelo funil |
| `POST` | `/opportunities/:id/project` | venda ganha vira projeto + receita de implantação |

### Entrega e rentabilidade

`products` · `projects` · `project-services` · `project-costs` — CRUD, mais:

| Método | Rota | Responde |
|---|---|---|
| `GET` | `/projects/:id/costs` | quanto custa manter o projeto, linha a linha |
| `GET` | `/projects/:id/economics` | receita, custo, lucro, margem e quebra por fornecedor |
| `GET` | `/projects/:id/usage` | consumo declarado (tokens, requisições) |
| `GET` | `/companies/:id/economics` | **quanto o cliente paga, custa e dá de lucro** |

```jsonc
// GET /api/v1/companies/:id/economics
{
  "data": {
    "company":   { "id": "…", "name": "Alpha Imóveis", "currency": "BRL" },
    "monthly":   { "revenue": 15000, "cost": 1500, "profit": 13500, "margin": 90 },
    "annualized":{ "revenue": 180000, "cost": 18000, "profit": 162000 },
    "projects":  [ { "name": "Automação de CRM", "revenue": 4000, "cost": 740, "margin": 81.5 } ]
  }
}
```

### Financeiro

`revenues` · `expenses` · `cost-allocations` — CRUD, mais:

| Método | Rota | Responde |
|---|---|---|
| `GET` | `/financial/summary` | MRR, ARR, custos, lucro bruto e líquido, faturamento do mês |
| `GET` | `/financial/revenue` | série mensal: faturado, pago, pendente, recorrente, pontual |
| `GET` | `/financial/expenses` | custos do mês por categoria e por fornecedor |
| `GET` | `/financial/profit` · `/financial/margins` | lucro consolidado e margem por projeto |
| `GET` | `/financial/mrr` · `/financial/arr` | recorrência total e por cliente |
| `GET` | `/financial/customer-profitability` | tabela cliente × receita × custo × lucro × margem, ordenável |
| `POST` | `/financial/generate-monthly-revenues` | gera as mensalidades da competência (idempotente) |

### Gestão e dashboard

`activities` · `interactions` · `customer-insights` · `goals` · `notifications` ·
`audit-logs` · `daily-brief`, mais `/goals/progress` (realizado calculado) e
`/dashboard/{summary,pipeline,revenue,profit,leads,conversion,activities,customer-profitability}`.

---

## Testes

```bash
npm test
```

48 testes rodam contra um **Postgres real** (PGlite) com migrations e seed
aplicados — o caminho completo HTTP → Fastify → SQL → RLS:

- **auth** — token ausente, adulterado e expirado; perfil; papéis (SALES não toca no financeiro, FINANCE não cria empresa, SALES não lê auditoria);
- **multi-tenancy** — usuário de outra organização não lê, não altera, não apaga, não agrega e não consegue plantar dado forjando `organizationId`;
- **CRM** — paginação, filtros, validação, soft delete, conversão de lead (com histórico e atividade), movimentação de etapa, venda → projeto;
- **financeiro e rentabilidade** — os números exatos do seed, normalização de período anual, custo pontual fora da recorrência, histórico de mudança de custo, MRR por cliente somando o total, metas e quebra por categoria/fornecedor.

---

## Produção

1. Crie o projeto no Supabase e aplique o schema:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
2. Configure as variáveis de ambiente (abaixo) no serviço que hospeda a API.
3. Suba a API:
   ```bash
   npm run build && npm start
   ```

Checklist antes de ir ao ar:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` só no servidor — nunca no frontend
- [ ] `CORS_ORIGINS` com os domínios reais
- [ ] `DATABASE_SSL=require` e connection string do **pooler** (6543)
- [ ] `supabase db push` aplicado (a migration de RLS falha se faltar policy)
- [ ] backups e PITR ativos no Supabase

---

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | sim | Postgres do Supabase (pooler em produção) |
| `DATABASE_SSL` | não | `require` (padrão) ou `disable` no local |
| `SUPABASE_URL` · `SUPABASE_ANON_KEY` | para login | Supabase Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | para o seed/admin | operações administrativas |
| `SUPABASE_JWT_SECRET` | recomendada | valida o token localmente, sem ida à rede |
| `CORS_ORIGINS` | sim | domínios do frontend |
| `RATE_LIMIT_MAX` · `RATE_LIMIT_WINDOW` | não | limite por usuário |
| `PORT` · `HOST` · `LOG_LEVEL` | não | processo |

Nenhum segredo tem valor padrão: o processo **não sobe** com configuração faltando.

---

## O que ficou preparado (e não implementado)

Existem como estrutura, sem nenhuma chamada externa nesta etapa:

- `integrations`, `webhook_events`, `external_messages` — WhatsApp e outros canais;
- `ai_agents`, `ai_conversations`, `ai_messages`, `ai_tasks`, `ai_actions` — agentes (com `approved_by` para manter humano no circuito);
- `project_usage` + `unit_cost`/`external_account_id` nos custos — importação automática de custo por consumo;
- `daily_briefs` — jornal matinal (a tabela e as rotas de leitura existem; a geração por agente virá depois);
- `cost_allocations` — rateio de custo compartilhado (a estrutura e o cálculo já estão de pé; o algoritmo de distribuição é o próximo passo).
