-- Diagnostico somente de leitura. Executar no SQL Editor do Supabase.
-- Nao habilita RLS, nao concede/revoga permissoes e nao altera dados.
select n.nspname as esquema, c.relname as tabela,
       c.relrowsecurity as rls_habilitada, c.relforcerowsecurity as rls_forcada
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
  and c.relname in ('grupos', 'eventos', 'encontros', 'ebook_edicoes',
                   'ebook_estado', 'grupo_edicoes', 'evento_edicoes', 'admin_backups')
order by c.relname;

-- Privilegios efetivos, incluindo os recebidos por heranca de outros papeis.
select c.relname as tabela, r.rolname as papel,
       has_table_privilege(r.oid, c.oid, 'SELECT') as pode_ler,
       has_table_privilege(r.oid, c.oid, 'INSERT') as pode_inserir,
       has_table_privilege(r.oid, c.oid, 'UPDATE') as pode_atualizar,
       has_table_privilege(r.oid, c.oid, 'DELETE') as pode_excluir
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join pg_roles r
where n.nspname = 'public' and c.relkind in ('r', 'p')
  and r.rolname in ('anon', 'authenticated', 'service_role')
  and c.relname in ('grupos', 'eventos', 'encontros', 'ebook_edicoes',
                   'ebook_estado', 'grupo_edicoes', 'evento_edicoes', 'admin_backups')
order by c.relname, r.rolname;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
  and table_name in ('grupos', 'eventos', 'encontros', 'ebook_edicoes',
                     'ebook_estado', 'grupo_edicoes', 'evento_edicoes', 'admin_backups')
order by table_name, grantee, privilege_type;

select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('grupos', 'eventos', 'encontros', 'ebook_edicoes',
                    'ebook_estado', 'grupo_edicoes', 'evento_edicoes', 'admin_backups')
order by tablename, policyname;
