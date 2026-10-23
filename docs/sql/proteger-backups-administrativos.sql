-- Protecao especifica dos backups. Nao executar como diagnostico.
-- Nao cria, modifica ou exclui registros; altera somente permissoes desta tabela.
-- A administracao publicada usa service_role, autenticada no servidor.
-- Execute apenas no SQL Editor, com o papel postgres, apos conferir o diagnostico.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if to_regclass('public.admin_backups') is null then
    raise exception 'Tabela admin_backups ausente. Nenhuma mudanca aplicada.';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role' and rolbypassrls) then
    raise exception 'service_role sem BYPASSRLS. Conferir configuracao antes de continuar.';
  end if;
end $$;

alter table public.admin_backups enable row level security;
revoke all privileges on table public.admin_backups from public, anon, authenticated;
grant select, insert, delete on table public.admin_backups to service_role;

-- Inclui privilegios herdados: qualquer acesso residual aborta a transacao.
do $$
declare papel text; privilegio text;
begin
  foreach papel in array array['anon', 'authenticated'] loop
    foreach privilegio in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
      if has_table_privilege(papel, 'public.admin_backups', privilegio) then
        raise exception 'Acesso residual de % via %. Transacao cancelada.', papel, privilegio;
      end if;
    end loop;
  end loop;
  foreach privilegio in array array['SELECT', 'INSERT', 'DELETE'] loop
    if not has_table_privilege('service_role', 'public.admin_backups', privilegio) then
      raise exception 'Permissao % ausente para service_role. Transacao cancelada.', privilegio;
    end if;
  end loop;
end $$;

commit;

-- Resultado final sem baixar os payloads dos backups.
select count(*) as backups_preservados from public.admin_backups;
