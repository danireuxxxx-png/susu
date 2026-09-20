-- =====================================================================
-- IA.centrism CRM — sua organização
--
-- ANTES DE RODAR: crie seu usuário em Authentication → Users → Add user
-- (marque "Auto Confirm User"). Depois troque o e-mail na linha abaixo
-- pelo que você usou, cole tudo no SQL Editor e clique em Run.
--
-- Rodar de novo não duplica nada.
-- =====================================================================

do $dono$
declare
  -- ↓↓↓ TROQUE AQUI ↓↓↓
  v_email          text := 'danireuxxxx@gmail.com';
  v_nome           text := 'Danilo Reux';
  v_organizacao    text := 'IA.centrism';
  -- ↑↑↑ TROQUE AQUI ↑↑↑

  v_user_id        uuid;
  v_organization_id uuid;
  v_pipeline_id    uuid;
  v_etapa          record;
  v_produto        record;
begin
  select id into v_user_id from auth.users where lower(email) = lower(v_email);

  if v_user_id is null then
    raise exception 'Nenhum usuário com o e-mail %. Crie em Authentication → Users → Add user e rode de novo.', v_email;
  end if;

  -- Perfil (o gatilho de cadastro já pode tê-lo criado).
  insert into public.profiles (id, name, email)
  values (v_user_id, v_nome, v_email)
  on conflict (id) do update set
    name  = coalesce(nullif(excluded.name, ''), public.profiles.name),
    email = coalesce(excluded.email, public.profiles.email);

  -- Organização e vínculo de dono.
  select organization_id into v_organization_id
  from public.organization_members
  where user_id = v_user_id and status = 'ACTIVE'
  limit 1;

  if v_organization_id is null then
    insert into public.organizations (name) values (v_organizacao)
    returning id into v_organization_id;

    insert into public.organization_members (organization_id, user_id, role, status)
    values (v_organization_id, v_user_id, 'OWNER', 'ACTIVE');

    raise notice 'Organização criada: %', v_organizacao;
  else
    raise notice 'Este usuário já pertence a uma organização.';
  end if;

  -- Funil padrão: sem ele não dá para criar oportunidade.
  select id into v_pipeline_id
  from public.pipelines
  where organization_id = v_organization_id and is_default
  limit 1;

  if v_pipeline_id is null then
    insert into public.pipelines (organization_id, name, description, is_default)
    values (v_organization_id, 'Funil comercial', 'Funil padrão', true)
    returning id into v_pipeline_id;

    for v_etapa in
      select * from (values
        ('Novo Lead', 0, 10, false, false),
        ('Qualificação', 1, 25, false, false),
        ('Reunião Agendada', 2, 40, false, false),
        ('Diagnóstico', 3, 55, false, false),
        ('Proposta Enviada', 4, 70, false, false),
        ('Negociação', 5, 85, false, false),
        ('Fechado / Ganho', 6, 100, true, false),
        ('Fechado / Perdido', 7, 0, false, true)
      ) as t(nome, posicao, probabilidade, ganho, perdido)
    loop
      insert into public.pipeline_stages (pipeline_id, name, position, probability, is_won, is_lost)
      values (v_pipeline_id, v_etapa.nome, v_etapa.posicao, v_etapa.probabilidade, v_etapa.ganho, v_etapa.perdido);
    end loop;

    raise notice 'Funil padrão criado com 8 etapas.';
  end if;

  -- Catálogo inicial de soluções.
  if not exists (select 1 from public.products where organization_id = v_organization_id) then
    for v_produto in
      select * from (values
        ('Agente de IA', 'AI_AGENT', 8000, 'MONTHLY'),
        ('Automação comercial', 'AUTOMATION', 4000, 'MONTHLY'),
        ('Chatbot de atendimento', 'CHATBOT', 3500, 'MONTHLY'),
        ('Integração de sistemas', 'INTEGRATION', 3000, 'MONTHLY'),
        ('Consultoria em IA', 'CONSULTING', 9000, 'ONE_TIME'),
        ('Suporte e sustentação', 'SUPPORT', 2500, 'MONTHLY')
      ) as t(nome, categoria, preco, cobranca)
    loop
      insert into public.products (organization_id, name, category, default_price, billing_type)
      values (v_organization_id, v_produto.nome, v_produto.categoria::public.product_category,
              v_produto.preco, v_produto.cobranca::public.billing_type);
    end loop;

    raise notice 'Catálogo criado com 6 soluções.';
  end if;

  raise notice 'Pronto. Organização %: %', v_organizacao, v_organization_id;
end;
$dono$;

-- Confira: deve aparecer uma linha com seu e-mail e o papel OWNER.
select p.email, m.role, o.name as organizacao
from public.organization_members m
join public.organizations o on o.id = m.organization_id
join public.profiles p on p.id = m.user_id;
