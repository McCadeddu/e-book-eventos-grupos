-- Somente leitura: verifica privilegios efetivos apos aplicar as politicas.
-- Resultado esperado: RLS=true, escrita publica=false e servidor_admin=true.
-- Backups e overrides editoriais devem ter leitura_anonima=false.
select c.relname as tabela,
       c.relrowsecurity as rls,
       has_table_privilege('anon', c.oid, 'SELECT') as leitura_anonima,
       has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE') as escrita_anonima,
       has_table_privilege('authenticated', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE') as escrita_authenticated,
       (has_table_privilege('service_role', c.oid, 'SELECT')
        and has_table_privilege('service_role', c.oid, 'INSERT')
        and has_table_privilege('service_role', c.oid, 'UPDATE')
        and has_table_privilege('service_role', c.oid, 'DELETE')) as servidor_admin
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
  and c.relname in ('grupos', 'eventos', 'encontros', 'ebook_edicoes',
                   'ebook_estado', 'evento_edicoes', 'admin_backups')
order by c.relname;
