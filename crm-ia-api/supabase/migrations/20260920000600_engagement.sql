-- =====================================================================
-- 0006 — Engajamento e gestão: atividades, interações, insights,
--        metas, notificações e briefings diários
-- =====================================================================

create table public.activities (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  lead_id          uuid references public.leads (id) on delete set null,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  project_id       uuid references public.projects (id) on delete set null,
  owner_id         uuid references public.profiles (id) on delete set null,
  type             public.activity_type not null default 'TASK',
  status           public.activity_status not null default 'PLANNED',
  title            text not null check (length(btrim(title)) > 0),
  notes            text,
  scheduled_at     timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint activities_done_consistency check (status <> 'DONE' or completed_at is not null)
);

create index activities_org_scheduled_idx on public.activities (organization_id, scheduled_at) where deleted_at is null;
create index activities_owner_idx on public.activities (owner_id, status) where deleted_at is null;
create index activities_opportunity_idx on public.activities (opportunity_id) where deleted_at is null;
create index activities_company_idx on public.activities (company_id) where deleted_at is null;
create index activities_pending_idx on public.activities (organization_id, scheduled_at)
  where status = 'PLANNED' and deleted_at is null;

create table public.interactions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  contact_id       uuid references public.contacts (id) on delete set null,
  lead_id          uuid references public.leads (id) on delete set null,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  channel          public.interaction_channel not null default 'OTHER',
  direction        public.interaction_direction not null default 'INBOUND',
  content          text,
  metadata         jsonb not null default '{}'::jsonb,
  external_id      text,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

comment on table public.interactions is
  'Histórico bruto de comunicação. Preparada para receber mensagens do WhatsApp no futuro.';

create index interactions_org_occurred_idx on public.interactions (organization_id, occurred_at desc);
create index interactions_company_idx on public.interactions (company_id, occurred_at desc);
create unique index interactions_external_unique on public.interactions (organization_id, channel, external_id)
  where external_id is not null;

create table public.customer_insights (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete cascade,
  contact_id       uuid references public.contacts (id) on delete cascade,
  key              text not null,
  value            text,
  source           public.insight_source not null default 'MANUAL',
  confidence       numeric(5, 2) check (confidence is null or confidence between 0 and 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint customer_insights_target check (company_id is not null or contact_id is not null)
);

comment on table public.customer_insights is
  'Perfil estruturado do cliente (orçamento, dores, urgência). Hoje manual; a coluna source já prevê IA.';

create index customer_insights_company_idx on public.customer_insights (company_id, key);

create table public.goals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  owner_id         uuid references public.profiles (id) on delete set null,
  type             public.goal_type not null,
  label            text not null,
  description      text,
  period           public.goal_period not null default 'MONTHLY',
  period_start     date not null,
  period_end       date not null,
  target_value     numeric(14, 2) not null check (target_value >= 0),
  currency         char(3) not null default 'BRL',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint goals_period_order check (period_end >= period_start)
);

comment on column public.goals.target_value is
  'Apenas o alvo. O realizado é sempre calculado a partir dos dados, nunca gravado aqui.';

create index goals_org_period_idx on public.goals (organization_id, period_start desc);

create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid references public.profiles (id) on delete cascade,
  title            text not null,
  description      text,
  tone             public.notification_tone not null default 'INFO',
  entity           text,
  entity_id        uuid,
  href             text,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

comment on column public.notifications.user_id is
  'Nulo = notificação da organização inteira; preenchido = destinada a um usuário.';

create index notifications_org_created_idx on public.notifications (organization_id, created_at desc);
create index notifications_unread_idx on public.notifications (organization_id, user_id) where read_at is null;

create table public.daily_briefs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  brief_date       date not null,
  summary          text,
  metrics          jsonb not null default '{}'::jsonb,
  insights         jsonb not null default '[]'::jsonb,
  priorities       jsonb not null default '[]'::jsonb,
  tasks            jsonb not null default '[]'::jsonb,
  generated_by     text not null default 'SYSTEM',
  created_at       timestamptz not null default now(),
  unique (organization_id, brief_date)
);

comment on table public.daily_briefs is
  'Jornal matinal. A estrutura existe; a geração automática por agente virá depois.';

create index daily_briefs_org_date_idx on public.daily_briefs (organization_id, brief_date desc);

create trigger activities_set_updated_at before update on public.activities
  for each row execute function public.set_updated_at();
create trigger customer_insights_set_updated_at before update on public.customer_insights
  for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
