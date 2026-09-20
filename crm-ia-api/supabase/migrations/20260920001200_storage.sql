-- =====================================================================
-- 0012 — Supabase Storage
--
-- Convenção de caminho: <organization_id>/<recurso>/<arquivo>
-- O primeiro segmento é a organização, e é ele que as policies checam.
--
-- O bloco é condicional para o schema rodar também fora do Supabase
-- (PGlite nos testes, Postgres puro em CI).
-- =====================================================================

do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'schema storage ausente — buckets ignorados neste ambiente';
    return;
  end if;

  -- Públicos: servem imagens exibidas na interface.
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('organization-logos', 'organization-logos', true, 2097152,
     array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
    ('avatars', 'avatars', true, 2097152,
     array['image/png', 'image/jpeg', 'image/webp'])
  on conflict (id) do nothing;

  -- Privados: contratos, propostas e anexos comerciais.
  insert into storage.buckets (id, name, public, file_size_limit)
  values
    ('documents', 'documents', false, 26214400),
    ('attachments', 'attachments', false, 26214400)
  on conflict (id) do nothing;

  -- Leitura dos buckets privados: só membros da organização dona da pasta.
  execute $p$
    create policy "org members read private files"
      on storage.objects for select to authenticated
      using (
        bucket_id in ('documents', 'attachments')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;

  execute $p$
    create policy "org members upload private files"
      on storage.objects for insert to authenticated
      with check (
        bucket_id in ('documents', 'attachments')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;

  execute $p$
    create policy "org admins delete private files"
      on storage.objects for delete to authenticated
      using (
        bucket_id in ('documents', 'attachments')
        and public.has_org_role(
          (storage.foldername(name))[1]::uuid,
          array['OWNER', 'ADMIN', 'MANAGER']::public.org_role[]
        )
      )
  $p$;

  -- Imagens públicas: qualquer um lê, só a organização escreve.
  execute $p$
    create policy "org members manage public images"
      on storage.objects for insert to authenticated
      with check (
        bucket_id in ('organization-logos', 'avatars')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;

  execute $p$
    create policy "org members update public images"
      on storage.objects for update to authenticated
      using (
        bucket_id in ('organization-logos', 'avatars')
        and (storage.foldername(name))[1]::uuid in (select public.current_user_org_ids())
      )
  $p$;
exception
  when duplicate_object then
    raise notice 'policies de storage já existem — nada a fazer';
end;
$$;
