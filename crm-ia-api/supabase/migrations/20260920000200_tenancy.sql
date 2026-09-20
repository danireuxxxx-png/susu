-- =====================================================================
-- 0002 — Tenancy: organizações, perfis, membros e helpers de RLS
--
-- Cadeia de identidade:
--   auth.users → profiles → organization_members → organizations
-- =====================================================================

create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(btrim(name)) > 0),
  legal_name    text,
  document      text,
  logo_url      text,
  industry      text,
  timezone      text not null default 'America/Sao_Paulo',
  currency      char(3) not null default 'BRL',
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.organizations is 'Tenant raiz. Toda informação de negócio pertence a uma organização.';

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  email       text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Dados de perfil do usuário autenticado. 1:1 com auth.users.';

create table public.organization_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  role             public.org_role not null default 'SALES',
  status           public.member_status not null default 'ACTIVE',
  invited_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.organization_members is
  'Vínculo usuário ↔ organização com papel. É a fonte de verdade do isolamento multi-tenant.';

create index organization_members_user_idx on public.organization_members (user_id, status);
create index organization_members_org_idx on public.organization_members (organization_id, status);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger organization_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Helpers de tenancy
--
-- São SECURITY DEFINER de propósito: as policies de organization_members
-- consultariam a própria tabela, o que geraria recursão infinita. O
-- search_path é fixado para impedir sequestro de resolução de nomes.
-- ---------------------------------------------------------------------

create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.organization_id
  from public.organization_members m
  where m.user_id = auth.uid()
    and m.status = 'ACTIVE';
$$;

comment on function public.current_user_org_ids is
  'Organizações ativas do usuário autenticado. Base de todas as policies de RLS.';

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.has_org_role(p_organization_id uuid, p_roles public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role = any (p_roles)
  );
$$;

comment on function public.has_org_role is
  'O usuário autenticado tem algum dos papéis informados na organização?';

create or replace function public.current_user_role(p_organization_id uuid)
returns public.org_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role
  from public.organization_members m
  where m.organization_id = p_organization_id
    and m.user_id = auth.uid()
    and m.status = 'ACTIVE'
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- Provisionamento
-- ---------------------------------------------------------------------

-- Cria o profile assim que o usuário nasce no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if exists (select 1 from pg_class where relname = 'users' and relnamespace = 'auth'::regnamespace) then
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

-- Cria organização + vínculo OWNER em uma transação só.
-- SECURITY DEFINER porque no instante da criação o usuário ainda não é
-- membro de nada — nenhuma policy de INSERT conseguiria autorizá-lo.
create or replace function public.create_organization(
  p_name text,
  p_legal_name text default null,
  p_document text default null,
  p_industry text default null,
  p_currency char(3) default 'BRL',
  p_timezone text default 'America/Sao_Paulo'
)
returns public.organizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_org public.organizations;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'organization name is required' using errcode = '22023';
  end if;

  insert into public.organizations (name, legal_name, document, industry, currency, timezone)
  values (btrim(p_name), p_legal_name, p_document, p_industry, coalesce(p_currency, 'BRL'), coalesce(p_timezone, 'America/Sao_Paulo'))
  returning * into v_org;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org.id, v_user_id, 'OWNER', 'ACTIVE');

  return v_org;
end;
$$;

comment on function public.create_organization is
  'Cria a organização e vincula quem chamou como OWNER, atomicamente.';
