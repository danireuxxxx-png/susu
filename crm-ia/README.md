# IA.centrism CRM — frontend

CRM SaaS para uma empresa que vende soluções de IA e automação: pipeline comercial,
carteira de clientes, financeiro, metas e as telas dos agentes de IA (WhatsApp e
jornal matinal).

**Esta é a etapa de frontend.** Não existe backend, banco, autenticação, integração
com WhatsApp nem chamada a modelos de IA. Tudo roda com dados mockados coerentes e
interações reais em memória — mas a arquitetura já está organizada para que a
troca por uma API seja feita em um único lugar.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build de produção
npm run preview  # serve o build
npm run lint
```

Node 20+.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Radix UI · Recharts · dnd-kit ·
React Router · date-fns · lucide-react.

## Rotas

| Rota | Tela |
|---|---|
| `/dashboard` | KPIs, receita no tempo, funil, receita × meta, origem dos leads, agenda e pendências |
| `/pipeline` | Kanban com drag and drop, visão em lista, filtros e drawer da oportunidade |
| `/leads` | Tabela de leads com abas por status, filtros e CRUD |
| `/clientes` | Carteira em cards ou tabela, MRR/ARR/LTV e saúde da conta |
| `/empresas` · `/empresas/:id` | Cadastro completo, contatos, negócios, histórico e inteligência do cliente |
| `/atividades` | Agenda com calendário, tipos de atividade e conclusão de tarefas |
| `/financeiro` | Receita, custo, lucro, margem, MRR/ARR e resultado por cliente |
| `/metas` | Meta mensal e metas comerciais com progresso |
| `/agentes` · `/agentes/whatsapp` | Catálogo dos agentes e simulação do agente de WhatsApp |
| `/jornal-matinal` | Briefing executivo diário gerado pela IA (mock) |
| `/configuracoes` | Perfil, empresa, preferências, tema e integrações |

Busca global em ⌘K / Ctrl+K.

## Arquitetura

```
src/
  components/
    ui/        primitivos do design system (Button, Card, DataTable, Drawer, KpiCard...)
    layout/    AppShell, sidebar, topbar, command palette, notificações
    charts/    gráficos Recharts com tooltip e legenda compartilhados
    crm/       componentes de domínio (Kanban, drawer da oportunidade, timeline, formulários)
  pages/       uma tela por rota
  store/       CrmProvider (useReducer), ThemeProvider, ToastProvider
  hooks/       useCrm, useTheme/useChartTheme, useToast, useMediaQuery, useDebouncedValue
  services/    contrato de dados (crmService, aiService, whatsappService) + transporte
  mock/        base fictícia gerada com semente fixa
  lib/         formatação (pt-BR), métricas derivadas e utilitários
  constants/   etapas do funil, rótulos, tokens de gráfico, navegação
  types/       modelo de domínio
```

### Fluxo de dados

`páginas → hooks/useCrm → CrmProvider → services → (hoje) mock`

O `CrmProvider` guarda o snapshot do workspace e aplica cada mutação pelo mesmo
caminho: chama o serviço e despacha o resultado no reducer. As alterações valem
apenas para a sessão (recarregar restaura a base).

### Onde o backend entra

- `src/services/api-client.ts` — único ponto de transporte. Hoje resolve contra o
  snapshot em memória com latência simulada (é o que faz os *skeletons* existirem);
  amanhã vira `fetch` ou uma query GraphQL. `VITE_API_URL` já é lido daqui.
- `src/services/crm.service.ts` — cada método está anotado com o verbo e a rota
  pretendidos (`GET /bootstrap`, `PATCH /opportunities/:id/stage`, ...).
- `src/services/ai.service.ts` — geração do jornal matinal e insights (LLM).
- `src/services/whatsapp.service.ts` — API oficial do WhatsApp Business e importação
  de conversas para o CRM.
- `src/types/index.ts` — o contrato que a API precisa devolver.

Autenticação, permissões, webhooks e o job do jornal matinal não foram implementados.

## Dados mockados

`src/mock` gera, com semente fixa (base idêntica a cada reload), 30 empresas,
20 clientes, 40 oportunidades, 50 leads, ~70 atividades, 12 meses de financeiro e
as metas do período. Os números são **derivados uns dos outros**, não sorteados de
forma independente:

- a receita do mês é a soma do MRR da carteira ativa com os projetos ganhos no mês;
- o valor do pipeline é a soma das oportunidades abertas;
- ticket médio, taxa de conversão e as metas leem o mesmo conjunto de oportunidades;
- a ficha da empresa recebe MRR, ticket e total vendido do contrato e dos negócios ganhos;
- o briefing matinal descreve a operação que as outras telas mostram.

As datas são ancoradas em "hoje", então a agenda e os follow-ups continuam fazendo
sentido com o passar dos dias.

## Design

Tema claro e escuro desenhados separadamente (o escuro não é uma inversão), tokens
em CSS custom properties (`src/index.css`) expostos ao Tailwind via `@theme inline`.

A paleta dos gráficos foi validada para daltonismo e contraste contra as superfícies
reais do produto (`#ffffff` no claro, `#17171b` no escuro): 8 matizes categóricos em
ordem fixa, rampa ordinal de um único matiz para o funil, cinza neutro para a
referência de meta e cores de status reservadas. As specs de marca (linha de 2px,
barra de até 24px com ponta arredondada, respiro de 2px entre segmentos empilhados,
grade recessiva, legenda sempre presente com duas ou mais séries) ficam em
`src/constants/charts.ts`.

## Responsividade

Sidebar fixa e recolhível no desktop, drawer no mobile; tabelas com rolagem
horizontal e colunas secundárias que somem em telas estreitas; Kanban com rolagem
horizontal e drag and drop por toque.
