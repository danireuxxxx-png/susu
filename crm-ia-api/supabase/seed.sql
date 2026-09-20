-- =====================================================================
-- Seed de desenvolvimento — IA.centrism CRM
--
-- Base determinística: os UUIDs derivam de md5(chave), então rodar de
-- novo produz exatamente os mesmos registros.
--
-- Os números foram escolhidos para serem verificáveis à mão. Exemplo:
--   Alpha Imóveis → 3 projetos, R$ 15.000 de receita, R$ 1.500 de custo,
--   R$ 13.500 de lucro, 90% de margem.
-- =====================================================================

create or replace function pg_temp.sid(p_key text) returns uuid
language sql immutable as $$
  -- UUID determinístico e válido: md5 com os nibbles de versão (4) e
  -- variante (a) corrigidos para o padrão RFC 4122.
  select overlay(overlay(md5(p_key) placing '4' from 13 for 1) placing 'a' from 17 for 1)::uuid
$$;

-- ---------------------------------------------------------------------
-- Limpeza da organização de seed (permite rodar várias vezes)
-- ---------------------------------------------------------------------
delete from public.organizations where id = pg_temp.sid('org:iacentrism');
delete from auth.users where id in (
  pg_temp.sid('user:owner'), pg_temp.sid('user:admin'),
  pg_temp.sid('user:manager'), pg_temp.sid('user:sales'),
  pg_temp.sid('user:finance'), pg_temp.sid('user:outsider')
);

-- ---------------------------------------------------------------------
-- Usuários
--
-- Senha de desenvolvimento: "dev-password-123" quando o pgcrypto estiver
-- disponível (Supabase). Em ambientes sem a extensão o hash fica nulo e o
-- login deve ser feito pelo script de seed via Admin API.
-- ---------------------------------------------------------------------
do $$
declare
  v_has_crypt boolean := exists (select 1 from pg_proc where proname = 'crypt');
  v_password text;
  u record;
begin
  for u in
    select * from (values
      (pg_temp.sid('user:owner'),    'owner@iacentrism.ai',   'Danilo Reux'),
      (pg_temp.sid('user:admin'),    'admin@iacentrism.ai',   'Marina Duarte'),
      (pg_temp.sid('user:manager'),  'manager@iacentrism.ai', 'Rafael Nunes'),
      (pg_temp.sid('user:sales'),    'sales@iacentrism.ai',   'Bianca Mota'),
      (pg_temp.sid('user:finance'),  'finance@iacentrism.ai', 'Caio Ferraz'),
      -- Usuário de outra organização: existe para os testes provarem que
      -- o isolamento multi-tenant funciona.
      (pg_temp.sid('user:outsider'), 'outsider@outra.ai',     'Pessoa de Fora')
    ) as t(id, email, name)
  loop
    if v_has_crypt then
      execute 'select crypt($1, gen_salt($2))' into v_password using 'dev-password-123', 'bf';
    else
      v_password := null;
    end if;

    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role)
    values (u.id, u.email, v_password, now(), jsonb_build_object('name', u.name), 'authenticated', 'authenticated')
    on conflict (id) do nothing;

    insert into public.profiles (id, name, email)
    values (u.id, u.name, u.email)
    on conflict (id) do update set name = excluded.name, email = excluded.email;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Organizações
-- ---------------------------------------------------------------------
insert into public.organizations (id, name, legal_name, document, industry, currency, timezone)
values (
  pg_temp.sid('org:iacentrism'),
  'IA.centrism',
  'IA.centrism Inteligência Artificial LTDA',
  '48.221.905/0001-32',
  'Tecnologia / IA',
  'BRL',
  'America/Sao_Paulo'
);

-- Segunda organização: nenhum dado dela pode vazar para a primeira.
insert into public.organizations (id, name, legal_name, currency)
values (pg_temp.sid('org:outra'), 'Outra Empresa', 'Outra Empresa LTDA', 'BRL')
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role, status)
values
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('user:owner'),   'OWNER',   'ACTIVE'),
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('user:admin'),   'ADMIN',   'ACTIVE'),
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('user:manager'), 'MANAGER', 'ACTIVE'),
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('user:sales'),   'SALES',   'ACTIVE'),
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('user:finance'), 'FINANCE', 'ACTIVE'),
  (pg_temp.sid('org:outra'),      pg_temp.sid('user:outsider'),'OWNER',   'ACTIVE')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Pipeline comercial
-- ---------------------------------------------------------------------
insert into public.pipelines (id, organization_id, name, description, is_default)
values (pg_temp.sid('pipeline:default'), pg_temp.sid('org:iacentrism'), 'Funil comercial', 'Funil padrão de soluções de IA', true);

insert into public.pipeline_stages (id, pipeline_id, name, position, probability, is_won, is_lost)
values
  (pg_temp.sid('stage:novo'),        pg_temp.sid('pipeline:default'), 'Novo Lead',          0, 10,  false, false),
  (pg_temp.sid('stage:qualif'),      pg_temp.sid('pipeline:default'), 'Qualificação',       1, 25,  false, false),
  (pg_temp.sid('stage:reuniao'),     pg_temp.sid('pipeline:default'), 'Reunião Agendada',   2, 40,  false, false),
  (pg_temp.sid('stage:diagnostico'), pg_temp.sid('pipeline:default'), 'Diagnóstico',        3, 55,  false, false),
  (pg_temp.sid('stage:proposta'),    pg_temp.sid('pipeline:default'), 'Proposta Enviada',   4, 70,  false, false),
  (pg_temp.sid('stage:negociacao'),  pg_temp.sid('pipeline:default'), 'Negociação',         5, 85,  false, false),
  (pg_temp.sid('stage:ganho'),       pg_temp.sid('pipeline:default'), 'Fechado / Ganho',    6, 100, true,  false),
  (pg_temp.sid('stage:perdido'),     pg_temp.sid('pipeline:default'), 'Fechado / Perdido',  7, 0,   false, true);

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
insert into public.products (id, organization_id, name, description, category, default_price, billing_type)
values
  (pg_temp.sid('product:agente'),     pg_temp.sid('org:iacentrism'), 'Agente de IA',            'Agente conversacional treinado no negócio do cliente', 'AI_AGENT'::public.product_category,   8000, 'MONTHLY'::public.billing_type),
  (pg_temp.sid('product:automacao'),  pg_temp.sid('org:iacentrism'), 'Automação comercial',     'Automação de funil e follow-up',                       'AUTOMATION'::public.product_category, 4000, 'MONTHLY'::public.billing_type),
  (pg_temp.sid('product:chatbot'),    pg_temp.sid('org:iacentrism'), 'Chatbot de atendimento',  'Atendimento 24/7 em múltiplos canais',                 'CHATBOT'::public.product_category,    3500, 'MONTHLY'::public.billing_type),
  (pg_temp.sid('product:integracao'), pg_temp.sid('org:iacentrism'), 'Integração de sistemas',  'Integração entre CRM, ERP e canais',                   'INTEGRATION'::public.product_category,3000, 'MONTHLY'::public.billing_type),
  (pg_temp.sid('product:crm'),        pg_temp.sid('org:iacentrism'), 'CRM sob medida',          'Implantação e operação de CRM',                        'CRM'::public.product_category,        6000, 'MONTHLY'::public.billing_type),
  (pg_temp.sid('product:custom'),     pg_temp.sid('org:iacentrism'), 'Desenvolvimento sob medida','Projetos de software específicos',                   'CUSTOM_DEV'::public.product_category,15000, 'ONE_TIME'::public.billing_type),
  (pg_temp.sid('product:consultoria'),pg_temp.sid('org:iacentrism'), 'Consultoria em IA',       'Diagnóstico e roadmap de automação',                   'CONSULTING'::public.product_category, 9000, 'ONE_TIME'::public.billing_type),
  (pg_temp.sid('product:suporte'),    pg_temp.sid('org:iacentrism'), 'Suporte e sustentação',   'Monitoramento e evolução contínua',                    'SUPPORT'::public.product_category,    2500, 'MONTHLY'::public.billing_type);

-- ---------------------------------------------------------------------
-- Empresas (20) — as 10 primeiras viram clientes com projeto
-- ---------------------------------------------------------------------
insert into public.companies (id, organization_id, trade_name, legal_name, document, industry, company_size, city, state, website, employees, owner_id, created_at)
select
  pg_temp.sid('company:' || c.slug),
  pg_temp.sid('org:iacentrism'),
  c.trade_name,
  c.trade_name || ' LTDA',
  lpad((row_number() over ())::text, 2, '0') || '.345.678/0001-' || lpad((10 + row_number() over ())::text, 2, '0'),
  c.industry,
  c.size::public.company_size,
  c.city,
  c.state,
  'www.' || c.slug || '.com.br',
  c.employees,
  pg_temp.sid('user:' || c.owner),
  now() - (c.age_days || ' days')::interval
from (values
  ('alpha',     'Alpha Imóveis',        'Imobiliário',        'MEDIUM',  'São Paulo',       'SP',  120, 'sales',   540),
  ('beta',      'Beta Contabilidade',   'Serviços financeiros','SMALL',  'Campinas',        'SP',   45, 'manager', 480),
  ('gamma',     'Gamma Educação',       'Educação',           'LARGE',   'Belo Horizonte',  'MG',  620, 'owner',   430),
  ('delta',     'Delta Logística',      'Logística',          'MEDIUM',  'Curitiba',        'PR',  210, 'sales',   390),
  ('orbita',    'Órbita Clínicas',      'Saúde',              'MEDIUM',  'Porto Alegre',    'RS',  180, 'manager', 120),
  ('vetor',     'Vetor Seguros',        'Seguros',            'LARGE',   'Rio de Janeiro',  'RJ',  850, 'owner',   360),
  ('nimbus',    'Nimbus Tecnologia',    'Tecnologia',         'SMALL',   'Florianópolis',   'SC',   38, 'sales',   300),
  ('prisma',    'Prisma Varejo',        'Varejo',             'LARGE',   'São Paulo',       'SP',  940, 'manager', 280),
  ('solaris',   'Solaris Energia',      'Energia',            'MEDIUM',  'Fortaleza',       'CE',  160, 'sales',   250),
  ('atlas',     'Atlas Construtora',    'Construção civil',   'MEDIUM',  'Goiânia',         'GO',  230, 'owner',   210),
  ('lumen',     'Lumen Odontologia',    'Saúde',              'MICRO',   'Ribeirão Preto',  'SP',    9, 'sales',   170),
  ('krono',     'Krono Advocacia',      'Jurídico',           'SMALL',   'Brasília',        'DF',   52, 'manager', 150),
  ('vertex',    'Vertex Academias',     'Fitness',            'MEDIUM',  'Salvador',        'BA',  140, 'sales',   130),
  ('magna',     'Magna Distribuidora',  'Distribuição',       'LARGE',   'Joinville',       'SC',  730, 'owner',   110),
  ('pulso',     'Pulso Marketing',      'Agência',            'SMALL',   'São Paulo',       'SP',   28, 'sales',    95),
  ('cedro',     'Cedro Alimentos',      'Alimentos',          'LARGE',   'Londrina',        'PR',  510, 'manager',  80),
  ('quantum',   'Quantum Fintech',      'Fintech',            'LARGE',   'São Paulo',       'SP',  410, 'owner',    62),
  ('meridiano', 'Meridiano Hotéis',     'Hotelaria',          'LARGE',   'Natal',           'RN',  380, 'sales',    45),
  ('terra',     'Terra Agro',           'Agronegócio',        'MEDIUM',  'Cuiabá',          'MT',  190, 'manager',  30),
  ('horizonte', 'Horizonte Eventos',    'Eventos',            'SMALL',   'Gramado',         'RS',   60, 'sales',    16)
) as c(slug, trade_name, industry, size, city, state, employees, owner, age_days);

-- ---------------------------------------------------------------------
-- Contatos (30): principal em cada empresa + 10 secundários
-- ---------------------------------------------------------------------
insert into public.contacts (id, organization_id, company_id, name, email, phone, whatsapp, job_title, is_primary)
select
  pg_temp.sid('contact:primary:' || c.id::text),
  c.organization_id,
  c.id,
  n.name,
  lower(split_part(n.name, ' ', 1)) || '@' || replace(replace(lower(c.trade_name), ' ', ''), '.', '') || '.com.br',
  '+55 (11) 9' || lpad((1000 + n.idx * 37)::text, 4, '0') || '-' || lpad((2000 + n.idx * 53)::text, 4, '0'),
  '+55 (11) 9' || lpad((1000 + n.idx * 37)::text, 4, '0') || '-' || lpad((2000 + n.idx * 53)::text, 4, '0'),
  n.role,
  true
from (
  select c.*, row_number() over (order by c.created_at) as idx
  from public.companies c
  where c.organization_id = pg_temp.sid('org:iacentrism')
) c
join (
  select * from (values
    (1,  'João Silva',        'CEO'),
    (2,  'Maria Oliveira',    'Diretora Comercial'),
    (3,  'Pedro Santos',      'Head de Marketing'),
    (4,  'Ana Costa',         'Gerente de Operações'),
    (5,  'Lucas Pereira',     'CTO'),
    (6,  'Juliana Almeida',   'COO'),
    (7,  'Rafael Lima',       'Sócio-fundador'),
    (8,  'Camila Rocha',      'Head de Growth'),
    (9,  'Bruno Carvalho',    'Gerente Comercial'),
    (10, 'Fernanda Ribeiro',  'Diretora de Atendimento'),
    (11, 'Gustavo Martins',   'CEO'),
    (12, 'Patrícia Gomes',    'Diretora Jurídica'),
    (13, 'Thiago Barbosa',    'Gerente Regional'),
    (14, 'Larissa Teixeira',  'Diretora Comercial'),
    (15, 'Felipe Moreira',    'CEO'),
    (16, 'Mariana Cardoso',   'Head de Operações'),
    (17, 'Rodrigo Nascimento','CTO'),
    (18, 'Beatriz Araújo',    'Gerente de Vendas'),
    (19, 'Diego Souza',       'Diretor Agro'),
    (20, 'Carolina Rodrigues','Head de Eventos')
  ) as t(idx, name, role)
) n on n.idx = c.idx;

insert into public.contacts (id, organization_id, company_id, name, email, phone, job_title, is_primary)
select
  pg_temp.sid('contact:secondary:' || c.id::text),
  c.organization_id,
  c.id,
  n.name,
  lower(split_part(n.name, ' ', 1)) || '.2@' || replace(replace(lower(c.trade_name), ' ', ''), '.', '') || '.com.br',
  '+55 (21) 9' || lpad((3000 + n.idx * 41)::text, 4, '0') || '-' || lpad((4000 + n.idx * 29)::text, 4, '0'),
  n.role,
  false
from (
  select c.*, row_number() over (order by c.created_at) as idx
  from public.companies c
  where c.organization_id = pg_temp.sid('org:iacentrism')
) c
join (
  select * from (values
    (1,  'Marcelo Dias',    'Gerente de TI'),
    (2,  'Renata Freitas',  'Analista Financeira'),
    (3,  'André Pinto',     'Coordenador Pedagógico'),
    (4,  'Priscila Alves',  'Supervisora de Frota'),
    (5,  'Vinícius Campos', 'Gerente de Clínica'),
    (6,  'Aline Barros',    'Analista de Processos'),
    (7,  'Eduardo Ramos',   'Tech Lead'),
    (8,  'Tatiane Correia', 'Gerente de Loja'),
    (9,  'Leonardo Farias', 'Engenheiro de Projetos'),
    (10, 'Sabrina Melo',    'Coordenadora de Obras')
  ) as t(idx, name, role)
) n on n.idx = c.idx;

-- ---------------------------------------------------------------------
-- Leads (50)
-- ---------------------------------------------------------------------
insert into public.leads (
  id, organization_id, company_id, contact_id, name, email, phone, job_title,
  source, status, temperature, estimated_value, owner_id, last_contact_at, created_at
)
select
  pg_temp.sid('lead:' || g.i::text),
  pg_temp.sid('org:iacentrism'),
  comp.id,
  null,
  (array['Larissa Gomes','Juliana Almeida','Patrícia Cardoso','Ana Teixeira','Gustavo Martins',
         'João Costa','Rodrigo Santos','Lucas Teixeira','Eduardo Nascimento','Mariana Moreira'])[1 + (g.i % 10)]
    || ' ' || g.i::text,
  'lead' || g.i::text || '@exemplo.com.br',
  '+55 (11) 9' || lpad((5000 + g.i * 17)::text, 4, '0') || '-' || lpad((6000 + g.i * 23)::text, 4, '0'),
  (array['CEO','Diretor Comercial','Head de Marketing','Gerente de Operações','CTO'])[1 + (g.i % 5)],
  (array['WHATSAPP','WHATSAPP','INSTAGRAM','REFERRAL','WEBSITE','OUTBOUND','EVENT','OTHER'])[1 + (g.i % 8)]::public.lead_source,
  (array['NEW','NEW','CONTACTED','QUALIFYING','QUALIFIED','UNQUALIFIED','CONVERTED','LOST'])[1 + (g.i % 8)]::public.lead_status,
  (array['COLD','WARM','HOT'])[1 + (g.i % 3)]::public.lead_temperature,
  (4000 + (g.i % 12) * 2000)::numeric,
  pg_temp.sid('user:' || (array['sales','manager','owner','admin'])[1 + (g.i % 4)]),
  now() - ((g.i % 20) || ' days')::interval,
  now() - ((g.i % 55) || ' days')::interval
from generate_series(1, 50) as g(i)
join lateral (
  select c.id from public.companies c
  where c.organization_id = pg_temp.sid('org:iacentrism')
  order by c.created_at
  offset (g.i % 20) limit 1
) comp on true;

-- ---------------------------------------------------------------------
-- Oportunidades (30)
-- ---------------------------------------------------------------------
insert into public.opportunities (
  id, organization_id, pipeline_id, stage_id, company_id, contact_id, owner_id,
  title, value, probability, priority, source, expected_close_date,
  last_interaction_at, won_at, created_at
)
select
  pg_temp.sid('opportunity:' || g.i::text),
  pg_temp.sid('org:iacentrism'),
  pg_temp.sid('pipeline:default'),
  st.id,
  comp.id,
  (select ct.id from public.contacts ct where ct.company_id = comp.id and ct.is_primary limit 1),
  pg_temp.sid('user:' || (array['sales','manager','owner','admin'])[1 + (g.i % 4)]),
  (array['Implementação de agente de IA','Automação de atendimento no WhatsApp','Agente de qualificação de leads',
         'Automação de follow-up comercial','Copiloto interno de vendas','Integração de CRM com IA',
         'Agente de suporte nível 1','Dashboard inteligente de operação'])[1 + (g.i % 8)],
  (6000 + (g.i % 14) * 2000)::numeric,
  st.probability,
  (array['LOW','MEDIUM','HIGH','URGENT'])[1 + (g.i % 4)]::public.priority_level,
  (array['WHATSAPP','INSTAGRAM','REFERRAL','WEBSITE','OUTBOUND'])[1 + (g.i % 5)]::public.lead_source,
  (current_date + ((g.i % 60) - 10))::date,
  now() - ((g.i % 9) || ' days')::interval,
  case when st.is_won then now() - ((g.i % 20) || ' days')::interval else null end,
  now() - ((g.i % 70) + 5 || ' days')::interval
from generate_series(1, 30) as g(i)
join lateral (
  select s.id, s.probability, s.is_won
  from public.pipeline_stages s
  where s.pipeline_id = pg_temp.sid('pipeline:default')
  order by s.position
  offset (g.i % 8) limit 1
) st on true
join lateral (
  select c.id from public.companies c
  where c.organization_id = pg_temp.sid('org:iacentrism')
  order by c.created_at
  offset (g.i % 20) limit 1
) comp on true;

insert into public.opportunity_stage_history (organization_id, opportunity_id, to_stage_id, changed_by, note)
select o.organization_id, o.id, o.stage_id, pg_temp.sid('user:sales'), 'Etapa registrada no seed'
from public.opportunities o
where o.organization_id = pg_temp.sid('org:iacentrism');

-- ---------------------------------------------------------------------
-- Projetos (15) em 10 clientes
--
-- Alpha Imóveis reproduz o exemplo de referência:
--   receita 15.000 · custo 1.500 · lucro 13.500 · margem 90%
-- ---------------------------------------------------------------------
insert into public.projects (
  id, organization_id, company_id, name, description, status,
  start_date, monthly_revenue, setup_revenue, owner_id
)
select
  pg_temp.sid('project:' || p.key),
  pg_temp.sid('org:iacentrism'),
  pg_temp.sid('company:' || p.company),
  p.name,
  p.description,
  p.status::public.project_status,
  (current_date - (p.age_days || ' days')::interval)::date,
  p.monthly_revenue,
  p.setup_revenue,
  pg_temp.sid('user:' || p.owner)
from (values
  ('alpha-agente',    'alpha',   'Agente Comercial IA',        'Atendimento e qualificação de leads no WhatsApp', 'ACTIVE',      8000,  6000, 'owner',   420),
  ('alpha-automacao', 'alpha',   'Automação de CRM',           'Rotinas de follow-up e atualização de funil',      'ACTIVE',      4000,  2500, 'manager', 300),
  ('alpha-suporte',   'alpha',   'Suporte IA pós-venda',       'Atendimento nível 1 automatizado',                 'ACTIVE',      3000,     0, 'sales',   180),
  ('beta-agente',     'beta',    'Agente de atendimento',      'Triagem de clientes contábeis',                    'ACTIVE',      5500,  4000, 'manager', 380),
  ('beta-fiscal',     'beta',    'Automação fiscal',           'Coleta e conferência de documentos',               'ACTIVE',      2800,  1800, 'manager', 200),
  ('gamma-matricula', 'gamma',   'Automação de matrículas',    'Fluxo completo de matrícula com IA',               'ACTIVE',      9200,  8000, 'owner',   340),
  ('gamma-aluno',     'gamma',   'Agente de suporte ao aluno', 'Dúvidas acadêmicas 24/7',                          'ACTIVE',      4500,  3000, 'owner',   150),
  ('delta-rastreio',  'delta',   'Agente de rastreio',         'Consulta de carga e segunda via',                  'ACTIVE',      6800,  5000, 'sales',   290),
  ('orbita-agenda',   'orbita',  'Agente de agendamento',      'Marcação e confirmação de consultas',              'ONBOARDING',  4200,  3500, 'manager',  25),
  ('vetor-copiloto',  'vetor',   'Copiloto de vendas',         'Assistente interno para corretores',               'ACTIVE',     12000, 10000, 'owner',   260),
  ('vetor-sinistros', 'vetor',   'Automação de sinistros',     'Abertura e acompanhamento automatizado',           'ONBOARDING',  3800,  3000, 'owner',    18),
  ('nimbus-integra',  'nimbus',  'Integração de CRM',          'Sincronização entre CRM e produto',                'ACTIVE',      3500,  2500, 'sales',   220),
  ('prisma-posvenda', 'prisma',  'Chatbot de pós-venda',       'Trocas, devoluções e status de pedido',            'ACTIVE',      7400,  6000, 'manager', 200),
  ('solaris-proposta','solaris', 'Automação de propostas',     'Geração automática de propostas técnicas',         'PAUSED',      5000,  4000, 'sales',   160),
  ('atlas-qualifica', 'atlas',   'Agente de qualificação',     'Pré-atendimento de compradores',                   'ACTIVE',      6200,  5000, 'owner',   140)
) as p(key, company, name, description, status, monthly_revenue, setup_revenue, owner, age_days);

-- Serviços vendidos dentro de cada projeto (compõem monthly_revenue)
insert into public.project_services (organization_id, project_id, product_id, name, price, billing_type)
select
  pg_temp.sid('org:iacentrism'),
  p.id,
  pg_temp.sid('product:agente'),
  'Plataforma do agente',
  round(p.monthly_revenue * 0.7, 2),
  'MONTHLY'::public.billing_type
from public.projects p where p.organization_id = pg_temp.sid('org:iacentrism')
union all
select
  pg_temp.sid('org:iacentrism'),
  p.id,
  pg_temp.sid('product:suporte'),
  'Sustentação e evolução',
  round(p.monthly_revenue * 0.3, 2),
  'MONTHLY'::public.billing_type
from public.projects p where p.organization_id = pg_temp.sid('org:iacentrism');

-- ---------------------------------------------------------------------
-- Custos dos projetos — o que faz o CRM responder "quanto custa manter"
-- ---------------------------------------------------------------------
insert into public.project_costs (
  organization_id, project_id, company_id, name, category, provider,
  cost_type, amount, billing_period, usage_based, estimated_monthly_cost, start_date
)
select
  pg_temp.sid('org:iacentrism'),
  p.id,
  p.company_id,
  c.name,
  c.category::public.cost_category,
  c.provider,
  c.cost_type::public.cost_type,
  c.amount,
  'MONTHLY'::public.billing_period,
  c.cost_type = 'USAGE_BASED',
  case when c.cost_type = 'USAGE_BASED' then c.amount else null end,
  p.start_date
from (values
  -- Alpha: 560 + 740 + 200 = 1.500
  ('alpha-agente',    'OpenAI — GPT',        'AI_API',       'OpenAI',    'USAGE_BASED', 280),
  ('alpha-agente',    'VPS de produção',     'VPS',          'Hetzner',   'FIXED',       120),
  ('alpha-agente',    'Supabase',            'DATABASE',     'Supabase',  'FIXED',        50),
  ('alpha-agente',    'WhatsApp Business API','WHATSAPP_API','Meta',      'VARIABLE',     90),
  ('alpha-agente',    'Storage de mídias',   'STORAGE',      'Cloudflare','FIXED',        20),
  ('alpha-automacao', 'VPS dedicada',        'VPS',          'Hetzner',   'FIXED',       500),
  ('alpha-automacao', 'API de enriquecimento','THIRD_PARTY_API','Clearbit','VARIABLE',   240),
  ('alpha-suporte',   'OpenAI — suporte',    'AI_API',       'OpenAI',    'USAGE_BASED', 150),
  ('alpha-suporte',   'Storage de anexos',   'STORAGE',      'AWS',       'FIXED',        50),
  -- Beta: 420 + 240
  ('beta-agente',     'Anthropic — Claude',  'AI_API',       'Anthropic', 'USAGE_BASED', 260),
  ('beta-agente',     'VPS',                 'VPS',          'DigitalOcean','FIXED',     100),
  ('beta-agente',     'WhatsApp API',        'WHATSAPP_API', 'Meta',      'VARIABLE',     60),
  ('beta-fiscal',     'OCR de documentos',   'THIRD_PARTY_API','Google',  'USAGE_BASED', 180),
  ('beta-fiscal',     'Storage fiscal',      'STORAGE',      'AWS',       'FIXED',        60),
  -- Gamma: 980 + 480
  ('gamma-matricula', 'OpenAI — GPT',        'AI_API',       'OpenAI',    'USAGE_BASED', 520),
  ('gamma-matricula', 'Infra Kubernetes',    'INFRASTRUCTURE','AWS',      'FIXED',       320),
  ('gamma-matricula', 'E-mail transacional', 'EMAIL',        'Resend',    'FIXED',       140),
  ('gamma-aluno',     'Anthropic — Claude',  'AI_API',       'Anthropic', 'USAGE_BASED', 340),
  ('gamma-aluno',     'VPS',                 'VPS',          'Hetzner',   'FIXED',       140),
  -- Delta: 610
  ('delta-rastreio',  'OpenAI — GPT',        'AI_API',       'OpenAI',    'USAGE_BASED', 310),
  ('delta-rastreio',  'VPS',                 'VPS',          'Hetzner',   'FIXED',       160),
  ('delta-rastreio',  'WhatsApp API',        'WHATSAPP_API', 'Meta',      'VARIABLE',     90),
  ('delta-rastreio',  'Supabase',            'DATABASE',     'Supabase',  'FIXED',        50),
  -- Órbita (onboarding): 380
  ('orbita-agenda',   'OpenAI — GPT',        'AI_API',       'OpenAI',    'USAGE_BASED', 190),
  ('orbita-agenda',   'VPS',                 'VPS',          'DigitalOcean','FIXED',     120),
  ('orbita-agenda',   'SMS de confirmação',  'SMS',          'Twilio',    'VARIABLE',     70),
  -- Vetor: 1.450 + 320
  ('vetor-copiloto',  'Anthropic — Claude',  'AI_API',       'Anthropic', 'USAGE_BASED', 780),
  ('vetor-copiloto',  'Infra dedicada',      'INFRASTRUCTURE','AWS',      'FIXED',       420),
  ('vetor-copiloto',  'Vector database',     'DATABASE',     'Supabase',  'FIXED',       180),
  ('vetor-copiloto',  'Domínio e CDN',       'DOMAIN',       'Cloudflare','FIXED',        70),
  ('vetor-sinistros', 'OpenAI — GPT',        'AI_API',       'OpenAI',    'USAGE_BASED', 200),
  ('vetor-sinistros', 'VPS',                 'VPS',          'Hetzner',   'FIXED',       120),
  -- Nimbus: 290
  ('nimbus-integra',  'API de integração',   'THIRD_PARTY_API','Zapier',  'VARIABLE',    190),
  ('nimbus-integra',  'VPS',                 'VPS',          'Hetzner',   'FIXED',       100),
  -- Prisma: 820
  ('prisma-posvenda', 'OpenAI — GPT',        'AI_API',       'OpenAI',    'USAGE_BASED', 430),
  ('prisma-posvenda', 'VPS',                 'VPS',          'AWS',       'FIXED',       250),
  ('prisma-posvenda', 'WhatsApp API',        'WHATSAPP_API', 'Meta',      'VARIABLE',    140),
  -- Solaris (pausado): 150
  ('solaris-proposta','VPS em standby',      'VPS',          'Hetzner',   'FIXED',       150),
  -- Atlas: 540
  ('atlas-qualifica', 'OpenAI — GPT',        'AI_API',       'OpenAI',    'USAGE_BASED', 290),
  ('atlas-qualifica', 'VPS',                 'VPS',          'DigitalOcean','FIXED',     150),
  ('atlas-qualifica', 'WhatsApp API',        'WHATSAPP_API', 'Meta',      'VARIABLE',    100)
) as c(project_key, name, category, provider, cost_type, amount)
join public.projects p on p.id = pg_temp.sid('project:' || c.project_key);

-- Consumo declarado dos custos por uso (base para apuração futura)
insert into public.project_usage (
  organization_id, project_id, project_cost_id, provider, period_start, period_end,
  requests, input_tokens, output_tokens, total_cost
)
select
  pc.organization_id,
  pc.project_id,
  pc.id,
  pc.provider,
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
  (pc.amount * 40)::bigint,
  (pc.amount * 9000)::bigint,
  (pc.amount * 2600)::bigint,
  pc.amount
from public.project_costs pc
where pc.category = 'AI_API' and pc.organization_id = pg_temp.sid('org:iacentrism');

-- ---------------------------------------------------------------------
-- Receitas faturadas — últimos 6 meses de mensalidade + implantações
-- ---------------------------------------------------------------------
insert into public.revenues (
  organization_id, company_id, project_id, description, amount, type, status,
  competence_date, due_date, paid_at
)
select
  p.organization_id,
  p.company_id,
  p.id,
  'Mensalidade — ' || p.name,
  p.monthly_revenue,
  'MONTHLY'::public.revenue_type,
  case when m.offset_months = 0 then 'PENDING' else 'PAID' end::public.revenue_status,
  (date_trunc('month', current_date) - (m.offset_months || ' months')::interval)::date,
  (date_trunc('month', current_date) - (m.offset_months || ' months')::interval + interval '9 days')::date,
  case when m.offset_months = 0 then null
       else (date_trunc('month', current_date) - (m.offset_months || ' months')::interval + interval '7 days')
  end
from public.projects p
cross join generate_series(0, 5) as m(offset_months)
where p.organization_id = pg_temp.sid('org:iacentrism')
  and p.status = 'ACTIVE'
  and p.monthly_revenue > 0
  -- Só fatura meses em que o projeto já existia.
  and (date_trunc('month', current_date) - (m.offset_months || ' months')::interval)::date >= date_trunc('month', p.start_date)::date;

insert into public.revenues (
  organization_id, company_id, project_id, description, amount, type, status,
  competence_date, due_date, paid_at
)
select
  p.organization_id,
  p.company_id,
  p.id,
  'Implantação — ' || p.name,
  p.setup_revenue,
  'SETUP'::public.revenue_type,
  'PAID'::public.revenue_status,
  p.start_date,
  p.start_date + 15,
  (p.start_date + 12)::timestamptz
from public.projects p
where p.organization_id = pg_temp.sid('org:iacentrism')
  and p.setup_revenue > 0;

-- ---------------------------------------------------------------------
-- Custos da operação (não pertencem a um cliente específico)
-- ---------------------------------------------------------------------
insert into public.organization_expenses (
  id, organization_id, name, category, provider, cost_type, amount, billing_period, recurring, start_date
)
values
  (pg_temp.sid('expense:equipe'),     pg_temp.sid('org:iacentrism'), 'Equipe interna',            'HUMAN_RESOURCE'::public.cost_category, null,        'FIXED'::public.cost_type,    28000, 'MONTHLY'::public.billing_period, true, current_date - 400),
  (pg_temp.sid('expense:escritorio'), pg_temp.sid('org:iacentrism'), 'Escritório e utilidades',   'OTHER'::public.cost_category,          null,        'FIXED'::public.cost_type,     3500, 'MONTHLY'::public.billing_period, true, current_date - 400),
  (pg_temp.sid('expense:ferramentas'),pg_temp.sid('org:iacentrism'), 'Ferramentas internas',      'SOFTWARE'::public.cost_category,       'Diversos',  'FIXED'::public.cost_type,     1800, 'MONTHLY'::public.billing_period, true, current_date - 400),
  (pg_temp.sid('expense:contabil'),   pg_temp.sid('org:iacentrism'), 'Contabilidade',             'SUPPORT'::public.cost_category,        null,        'FIXED'::public.cost_type,      900, 'MONTHLY'::public.billing_period, true, current_date - 400),
  (pg_temp.sid('expense:servidor'),   pg_temp.sid('org:iacentrism'), 'Servidor principal',        'INFRASTRUCTURE'::public.cost_category, 'Hetzner',   'FIXED'::public.cost_type,     1200, 'MONTHLY'::public.billing_period, true, current_date - 400),
  (pg_temp.sid('expense:marketing'),  pg_temp.sid('org:iacentrism'), 'Mídia paga',                'MARKETING'::public.cost_category,      'Meta',      'VARIABLE'::public.cost_type,  2500, 'MONTHLY'::public.billing_period, true, current_date - 200);

-- Exemplo de rateio: o servidor principal atende dois projetos.
-- Mantido em 0% para não alterar os números de referência do seed — a
-- estrutura existe e o cálculo já lê daqui.
insert into public.cost_allocations (organization_id, organization_expense_id, project_id, allocation_type, allocation_value, notes)
values
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('expense:servidor'), pg_temp.sid('project:alpha-agente'), 'PERCENTAGE'::public.allocation_type, 0, 'Rateio preparado, ainda não aplicado'),
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('expense:servidor'), pg_temp.sid('project:gamma-matricula'), 'PERCENTAGE'::public.allocation_type, 0, 'Rateio preparado, ainda não aplicado');

-- ---------------------------------------------------------------------
-- Atividades, interações e insights
-- ---------------------------------------------------------------------
insert into public.activities (
  organization_id, company_id, opportunity_id, owner_id, type, status, title,
  scheduled_at, duration_minutes, completed_at, notes
)
select
  o.organization_id,
  o.company_id,
  o.id,
  o.owner_id,
  (array['CALL','WHATSAPP','EMAIL','MEETING','FOLLOW_UP','TASK'])[1 + (g.i % 6)]::public.activity_type,
  case when g.i % 3 = 0 then 'DONE' else 'PLANNED' end::public.activity_status,
  (array['Ligação de qualificação','Mensagem de follow-up','Envio de proposta','Reunião de diagnóstico',
         'Follow-up da proposta','Montar escopo técnico'])[1 + (g.i % 6)],
  now() + ((g.i % 14) - 6 || ' days')::interval + ((9 + g.i % 8) || ' hours')::interval,
  (array[20, 30, 45, 60])[1 + (g.i % 4)],
  case when g.i % 3 = 0 then now() - ((g.i % 5) || ' days')::interval else null end,
  'Atividade gerada pelo seed de desenvolvimento.'
from generate_series(1, 45) as g(i)
join lateral (
  select o.* from public.opportunities o
  where o.organization_id = pg_temp.sid('org:iacentrism')
  order by o.created_at
  offset (g.i % 30) limit 1
) o on true;

insert into public.interactions (
  organization_id, company_id, contact_id, opportunity_id, channel, direction, content, occurred_at
)
select
  o.organization_id,
  o.company_id,
  (select ct.id from public.contacts ct where ct.company_id = o.company_id and ct.is_primary limit 1),
  o.id,
  (array['WHATSAPP','EMAIL','PHONE','MEETING'])[1 + (g.i % 4)]::public.interaction_channel,
  case when g.i % 2 = 0 then 'INBOUND' else 'OUTBOUND' end::public.interaction_direction,
  (array['Cliente pediu detalhes do escopo.','Enviamos a proposta revisada.',
         'Cliente confirmou a reunião.','Cliente perguntou sobre integração com o ERP.'])[1 + (g.i % 4)],
  now() - ((g.i % 25) || ' days')::interval
from generate_series(1, 20) as g(i)
join lateral (
  select o.* from public.opportunities o
  where o.organization_id = pg_temp.sid('org:iacentrism')
  order by o.created_at
  offset (g.i % 30) limit 1
) o on true;

insert into public.customer_insights (organization_id, company_id, key, value, source, confidence)
select
  c.organization_id,
  c.id,
  k.key,
  k.value,
  'MANUAL'::public.insight_source,
  k.confidence
from (
  select c.* , row_number() over (order by c.created_at) as idx
  from public.companies c
  where c.organization_id = pg_temp.sid('org:iacentrism')
) c
cross join (values
  ('budget',        'R$ 10.000 — R$ 20.000', 88),
  ('pain_points',   'Equipe sobrecarregada; follow-up manual', 91),
  ('needs',         'Automatizar atendimento e qualificar leads', 93),
  ('urgency',       'Alta', 84)
) as k(key, value, confidence)
where c.idx <= 6;

-- ---------------------------------------------------------------------
-- Metas do mês
-- ---------------------------------------------------------------------
insert into public.goals (organization_id, type, label, description, period, period_start, period_end, target_value, owner_id)
select
  pg_temp.sid('org:iacentrism'),
  g.type::public.goal_type,
  g.label,
  g.description,
  'MONTHLY'::public.goal_period,
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
  g.target,
  pg_temp.sid('user:owner')
from (values
  ('REVENUE',     'Receita mensal',      'Receita recorrente somada aos projetos fechados no mês', 90000),
  ('MRR',         'MRR',                 'Receita recorrente contratada',                          85000),
  ('NEW_CLIENTS', 'Novos clientes',      'Contratos assinados que entraram em implantação',            8),
  ('MEETINGS',    'Reuniões realizadas', 'Diagnósticos e demos concluídos pelo time',                 40),
  ('PROPOSALS',   'Propostas enviadas',  'Propostas comerciais entregues no período',                 32),
  ('MARGIN',      'Margem bruta',        'Margem sobre os projetos entregues',                        85)
) as g(type, label, description, target);

-- ---------------------------------------------------------------------
-- Notificações e jornal matinal
-- ---------------------------------------------------------------------
insert into public.notifications (organization_id, user_id, title, description, tone, href, created_at)
values
  (pg_temp.sid('org:iacentrism'), null, 'Alpha Imóveis respondeu sua proposta', 'O contato pediu revisão do escopo antes de aprovar.', 'SUCCESS'::public.notification_tone, '/pipeline', now() - interval '12 minutes'),
  (pg_temp.sid('org:iacentrism'), null, '3 leads sem contato há mais de 24h', 'Priorize o follow-up destes contatos.', 'WARNING'::public.notification_tone, '/leads', now() - interval '2 hours'),
  (pg_temp.sid('org:iacentrism'), pg_temp.sid('user:owner'), 'Reunião começa em 30 minutos', 'Demo da solução com Gamma Educação.', 'INFO'::public.notification_tone, '/atividades', now() - interval '3 hours'),
  (pg_temp.sid('org:iacentrism'), null, 'Meta mensal está em 81%', 'Faltam 11 dias para o fechamento do mês.', 'INFO'::public.notification_tone, '/metas', now() - interval '6 hours'),
  (pg_temp.sid('org:iacentrism'), null, 'Custo do projeto Vetor subiu 12%', 'A conta da Anthropic aumentou no último ciclo.', 'CRITICAL'::public.notification_tone, '/financeiro', now() - interval '20 hours');

insert into public.daily_briefs (organization_id, brief_date, summary, metrics, insights, priorities, generated_by)
values (
  pg_temp.sid('org:iacentrism'),
  current_date,
  'Ontem a operação gerou R$ 18.400 em novas oportunidades e 7 leads entraram no pipeline. Quatro oportunidades precisam de follow-up hoje.',
  jsonb_build_object('newLeads', 7, 'meetings', 3, 'proposals', 2, 'wonDeals', 1, 'revenue', 18400),
  jsonb_build_array(
    jsonb_build_object('text', 'O pipeline cresceu 14% nesta semana.', 'tone', 'positive'),
    jsonb_build_object('text', 'A etapa de negociação concentra 38% do valor total.', 'tone', 'neutral')
  ),
  jsonb_build_array(
    jsonb_build_object('title', 'Follow-up — Alpha Imóveis', 'value', 12000, 'priority', 'HIGH')
  ),
  'SEED'
);

-- ---------------------------------------------------------------------
-- Conferência do seed: os números precisam bater na mão
-- ---------------------------------------------------------------------
do $$
declare
  v_alpha record;
  v_org record;
begin
  select * into v_alpha
  from public.company_economics_at(current_date)
  where company_id = pg_temp.sid('company:alpha');

  if v_alpha.monthly_revenue <> 15000 or v_alpha.monthly_cost <> 1500 or v_alpha.margin <> 90 then
    raise exception 'seed inconsistente para Alpha Imóveis: receita=% custo=% margem=%',
      v_alpha.monthly_revenue, v_alpha.monthly_cost, v_alpha.margin;
  end if;

  select * into v_org
  from public.organization_economics_at(current_date)
  where organization_id = pg_temp.sid('org:iacentrism');

  if v_org.mrr <> 72900 or v_org.project_monthly_cost <> 8180 then
    raise exception 'seed inconsistente na organização: mrr=% custo=%', v_org.mrr, v_org.project_monthly_cost;
  end if;

  raise notice 'seed aplicado — MRR % / custo de projetos % / lucro bruto %',
    v_org.mrr, v_org.project_monthly_cost, v_org.gross_profit;
end;
$$;
