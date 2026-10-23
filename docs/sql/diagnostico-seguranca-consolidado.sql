-- SOMENTE LEITURA: execute tudo de uma vez no SQL Editor.
-- Retorna uma linha de metadados, sem registros pastorais, payloads ou credenciais.
with tabelas as (
  select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
    and c.relname in ('grupos', 'eventos', 'encontros', 'ebook_edicoes',
                     'ebook_estado', 'grupo_edicoes', 'evento_edicoes', 'admin_backups')
), privilegios as (
  select t.relname as tabela, r.rolname as papel,
    has_table_privilege(r.oid, t.oid, 'SELECT') as leitura,
    has_table_privilege(r.oid, t.oid, 'INSERT') as insercao,
    has_table_privilege(r.oid, t.oid, 'UPDATE') as atualizacao,
    has_table_privilege(r.oid, t.oid, 'DELETE') as exclusao,
    has_table_privilege(r.oid, t.oid, 'TRUNCATE') as truncamento
  from tabelas t cross join pg_roles r
  where r.rolname in ('anon', 'authenticated', 'service_role')
)
select jsonb_build_object(
  'tabelas', coalesce((select jsonb_agg(jsonb_build_object(
    'tabela', relname, 'rls', relrowsecurity, 'rls_forcada', relforcerowsecurity
  ) order by relname) from tabelas), '[]'::jsonb),
  'privilegios', coalesce((select jsonb_agg(to_jsonb(p) order by tabela, papel)
    from privilegios p), '[]'::jsonb),
  'politicas', coalesce((select jsonb_agg(to_jsonb(p)) from (
    select tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies where schemaname = 'public'
      and tablename in (select relname from tabelas)
    order by tablename, policyname
  ) p), '[]'::jsonb),
  'colunas', coalesce((select jsonb_agg(to_jsonb(p)) from (
    select table_name, column_name, data_type, udt_name, is_nullable
    from information_schema.columns where table_schema = 'public'
      and table_name in (select relname from tabelas)
    order by table_name, ordinal_position
  ) p), '[]'::jsonb),
  'restricoes', coalesce((select jsonb_agg(to_jsonb(p)) from (
    select t.relname as tabela, c.conname as nome, c.contype as tipo,
      pg_get_constraintdef(c.oid) as definicao
    from pg_constraint c join tabelas t on t.oid = c.conrelid
    order by t.relname, c.conname
  ) p), '[]'::jsonb),
  'papeis', coalesce((select jsonb_agg(jsonb_build_object(
    'papel', rolname, 'ignora_rls', rolbypassrls, 'superusuario', rolsuper
  ) order by rolname) from pg_roles
    where rolname in ('anon', 'authenticated', 'service_role')), '[]'::jsonb)
) as diagnostico;
