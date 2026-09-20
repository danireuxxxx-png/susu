-- =====================================================================
-- 0008 — Infraestrutura preparada (SEM implementação)
--
-- As tabelas abaixo existem para que agentes de IA, WhatsApp e coleta
-- automática de custos possam ser ligados depois sem migração de dados.
-- Nenhuma rota da API escreve nelas nesta etapa.
-- =====================================================================

create table public.integrations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  provider         text not null,
  kind             text not null default 'GENERIC',
  status           text not null default 'DISCONNECTED',
  external_account_id text,
  config           jsonb not null default '{}'::jsonb,
  -- Credenciais NUNCA em texto puro: guardar somente a referência a um
  -- secret manager (Supabase Vault, AWS Secrets Manager...).
  credentials_ref  text,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, provider, kind)
);

comment on column public.integrations.credentials_ref is
  'Referência a um secret externo. Nenhuma chave de API é persistida no banco.';

create table public.webhook_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations (id) on delete cascade,
  integration_id   uuid references public.integrations (id) on delete set null,
  provider         text not null,
  event_type       text,
  external_id      text,
  payload          jsonb not null default '{}'::jsonb,
  signature_valid  boolean,
  processed_at     timestamptz,
  error            text,
  received_at      timestamptz not null default now()
);

create index webhook_events_pending_idx on public.webhook_events (provider, received_at) where processed_at is null;
create unique index webhook_events_external_unique on public.webhook_events (provider, external_id)
  where external_id is not null;

create table public.external_messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  integration_id   uuid references public.integrations (id) on delete set null,
  interaction_id   uuid references public.interactions (id) on delete set null,
  channel          public.interaction_channel not null default 'WHATSAPP',
  direction        public.interaction_direction not null default 'INBOUND',
  external_id      text,
  from_identifier  text,
  to_identifier    text,
  content          text,
  metadata         jsonb not null default '{}'::jsonb,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index external_messages_org_idx on public.external_messages (organization_id, occurred_at desc);

-- --------------------------------------------------------------
-- Agentes de IA — estrutura apenas. Nenhuma chamada a LLM existe
-- neste backend.
-- --------------------------------------------------------------
create table public.ai_agents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  key              text not null,
  name             text not null,
  description      text,
  status           text not null default 'DISABLED',
  config           jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, key)
);

create table public.ai_conversations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  agent_id         uuid references public.ai_agents (id) on delete set null,
  company_id       uuid references public.companies (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  lead_id          uuid references public.leads (id) on delete set null,
  channel          public.interaction_channel not null default 'WHATSAPP',
  status           text not null default 'OPEN',
  metadata         jsonb not null default '{}'::jsonb,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz
);

create table public.ai_messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  conversation_id  uuid not null references public.ai_conversations (id) on delete cascade,
  role             text not null,
  content          text,
  tokens_input     integer,
  tokens_output    integer,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

create table public.ai_tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  agent_id         uuid references public.ai_agents (id) on delete set null,
  kind             text not null,
  status           text not null default 'PENDING',
  payload          jsonb not null default '{}'::jsonb,
  result           jsonb,
  error            text,
  scheduled_for    timestamptz,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index ai_tasks_pending_idx on public.ai_tasks (status, scheduled_for) where status = 'PENDING';

create table public.ai_actions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  task_id          uuid references public.ai_tasks (id) on delete cascade,
  entity           text not null,
  entity_id        uuid,
  action           text not null,
  payload          jsonb not null default '{}'::jsonb,
  applied_at       timestamptz,
  approved_by      uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);

comment on table public.ai_actions is
  'Ações propostas por um agente. O campo approved_by existe para manter humano no circuito.';

create trigger integrations_set_updated_at before update on public.integrations
  for each row execute function public.set_updated_at();
create trigger ai_agents_set_updated_at before update on public.ai_agents
  for each row execute function public.set_updated_at();
