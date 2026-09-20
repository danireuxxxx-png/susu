-- =====================================================================
-- 0001 — Tipos, domínios e helpers compartilhados
--
-- Convenções do schema:
--   * toda tabela de negócio carrega organization_id (multi-tenant);
--   * dinheiro é numeric(14,2) — nunca float;
--   * datas de auditoria são timestamptz;
--   * exclusão lógica via deleted_at em entidades de histórico.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Papéis e acesso
-- ---------------------------------------------------------------------
create type public.org_role as enum ('OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'VIEWER');
create type public.member_status as enum ('ACTIVE', 'INVITED', 'SUSPENDED');

-- ---------------------------------------------------------------------
-- CRM
-- ---------------------------------------------------------------------
create type public.company_size as enum ('MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');
create type public.lead_status as enum (
  'NEW', 'CONTACTED', 'QUALIFYING', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'
);
create type public.lead_temperature as enum ('COLD', 'WARM', 'HOT');
create type public.lead_source as enum (
  'WHATSAPP', 'INSTAGRAM', 'REFERRAL', 'WEBSITE', 'OUTBOUND', 'EVENT', 'OTHER'
);
create type public.priority_level as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- ---------------------------------------------------------------------
-- Entrega
-- ---------------------------------------------------------------------
create type public.project_status as enum (
  'PROPOSED', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'
);
create type public.product_category as enum (
  'AI_AGENT', 'AUTOMATION', 'CRM', 'CHATBOT', 'INTEGRATION',
  'CUSTOM_DEV', 'SAAS', 'CONSULTING', 'SUPPORT', 'OTHER'
);
create type public.billing_type as enum ('ONE_TIME', 'MONTHLY', 'YEARLY', 'USAGE_BASED');

-- ---------------------------------------------------------------------
-- Custos e receitas
-- ---------------------------------------------------------------------
create type public.billing_period as enum (
  'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME'
);
create type public.cost_type as enum ('FIXED', 'VARIABLE', 'USAGE_BASED');
create type public.cost_category as enum (
  'AI_API', 'HOSTING', 'VPS', 'DATABASE', 'STORAGE', 'DOMAIN', 'EMAIL',
  'WHATSAPP_API', 'SMS', 'AUTOMATION', 'THIRD_PARTY_API', 'SOFTWARE',
  'INFRASTRUCTURE', 'SUPPORT', 'HUMAN_RESOURCE', 'MARKETING', 'OTHER'
);
create type public.allocation_type as enum ('FIXED', 'PERCENTAGE', 'USAGE');
create type public.revenue_type as enum ('SETUP', 'MONTHLY', 'ANNUAL', 'ONE_TIME', 'OTHER');
create type public.revenue_status as enum ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- ---------------------------------------------------------------------
-- Engajamento e gestão
-- ---------------------------------------------------------------------
create type public.activity_type as enum (
  'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'TASK', 'NOTE'
);
create type public.activity_status as enum ('PLANNED', 'DONE', 'CANCELLED');
create type public.interaction_channel as enum (
  'WHATSAPP', 'EMAIL', 'PHONE', 'MEETING', 'CHAT', 'FORM', 'OTHER'
);
create type public.interaction_direction as enum ('INBOUND', 'OUTBOUND');
create type public.insight_source as enum ('MANUAL', 'IMPORT', 'AI');
create type public.goal_type as enum (
  'REVENUE', 'NEW_CLIENTS', 'MEETINGS', 'PROPOSALS', 'CONVERSIONS',
  'PIPELINE', 'PROFIT', 'MARGIN', 'MRR'
);
create type public.goal_period as enum ('MONTHLY', 'QUARTERLY', 'YEARLY');
create type public.notification_tone as enum ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');
create type public.audit_action as enum (
  'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
  'PERMISSION_CHANGE', 'STAGE_CHANGE', 'FINANCIAL_CHANGE'
);

-- ---------------------------------------------------------------------
-- Helpers genéricos
-- ---------------------------------------------------------------------

-- Mantém updated_at coerente sem depender da aplicação.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Trigger BEFORE UPDATE: carimba updated_at. Usado por todas as tabelas com esse campo.';

-- Converte qualquer valor recorrente para a base mensal.
-- ONE_TIME devolve 0: custo/receita pontual não compõe recorrência.
create or replace function public.to_monthly_amount(p_amount numeric, p_period public.billing_period)
returns numeric
language sql
immutable
as $$
  select case p_period
    when 'DAILY'      then coalesce(p_amount, 0) * 365 / 12
    when 'WEEKLY'     then coalesce(p_amount, 0) * 52 / 12
    when 'MONTHLY'    then coalesce(p_amount, 0)
    when 'QUARTERLY'  then coalesce(p_amount, 0) / 3
    when 'SEMIANNUAL' then coalesce(p_amount, 0) / 6
    when 'YEARLY'     then coalesce(p_amount, 0) / 12
    when 'ONE_TIME'   then 0
    else 0
  end;
$$;

comment on function public.to_monthly_amount is
  'Normaliza um valor recorrente para a base mensal. ONE_TIME = 0 (não é recorrência).';

-- Um registro com janela de vigência está ativo no mês de referência?
create or replace function public.is_active_in_month(p_start date, p_end date, p_reference date)
returns boolean
language sql
immutable
as $$
  select coalesce(p_start, '-infinity'::date) <= (date_trunc('month', p_reference) + interval '1 month - 1 day')::date
     and (p_end is null or p_end >= date_trunc('month', p_reference)::date);
$$;

comment on function public.is_active_in_month is
  'Vigência: o período [start, end] intersecta o mês de referência?';

-- Margem percentual com divisão protegida.
create or replace function public.safe_margin(p_profit numeric, p_revenue numeric)
returns numeric
language sql
immutable
as $$
  select case
    when coalesce(p_revenue, 0) = 0 then 0
    else round((coalesce(p_profit, 0) / p_revenue) * 100, 2)
  end;
$$;

comment on function public.safe_margin is
  'Margem % = lucro / receita * 100, devolvendo 0 quando não há receita.';
