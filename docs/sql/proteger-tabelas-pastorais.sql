-- Seguranca das tabelas confirmadas no diagnostico de 23/10/2026.
-- Aplicar depois de publicar os leitores publicos sem fallback historico.
-- Nao altera nem exclui registros. Nao cria tabelas de edicoes anuais.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare nome text;
begin
  if not exists (select 1 from pg_roles where rolname = 'service_role' and rolbypassrls) then
    raise exception 'service_role precisa de BYPASSRLS. Nenhuma mudanca aplicada.';
  end if;
  foreach nome in array array['grupos', 'eventos', 'encontros', 'ebook_edicoes',
                             'ebook_estado', 'evento_edicoes', 'admin_backups'] loop
    if to_regclass(format('public.%I', nome)) is null then
      raise exception 'Tabela % ausente. Conferir esquema antes de aplicar.', nome;
    end if;
    if exists (select 1 from pg_policies where schemaname = 'public'
               and tablename = nome and policyname <> 'pascom_public_read') then
      raise exception 'Politicas nao previstas em %. Revisar antes de substituir.', nome;
    end if;
    execute format('alter table public.%I enable row level security', nome);
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', nome);
    execute format('grant select, insert, update, delete on table public.%I to service_role', nome);
    execute format('drop policy if exists pascom_public_read on public.%I', nome);
  end loop;
end $$;

grant select on table public.grupos, public.eventos, public.encontros,
                      public.ebook_edicoes, public.ebook_estado to anon, authenticated;

create policy pascom_public_read on public.grupos
  for select to anon, authenticated using (true);
create policy pascom_public_read on public.eventos
  for select to anon, authenticated using (visibilidade = 'publico');
create policy pascom_public_read on public.encontros
  for select to anon, authenticated using (
    visibilidade = 'publico'
    and (evento_id is null or exists (
      select 1 from public.eventos e
      where e.id = encontros.evento_id and e.visibilidade = 'publico'
    ))
  );
-- Configuracao publica: anos, titulos, capas e estado de publicacao, sem credenciais.
create policy pascom_public_read on public.ebook_edicoes
  for select to anon, authenticated using (true);
create policy pascom_public_read on public.ebook_estado
  for select to anon, authenticated using (true);
-- Backups e overrides editoriais ficam restritos ao servidor administrativo.
-- A infraestrutura de edicao anual sera implementada separadamente.

do $$
declare nome text; papel text; privilegio text;
begin
  foreach nome in array array['grupos', 'eventos', 'encontros', 'ebook_edicoes',
                             'ebook_estado', 'evento_edicoes', 'admin_backups'] loop
    foreach papel in array array['anon', 'authenticated'] loop
      foreach privilegio in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
        if has_table_privilege(papel, format('public.%I', nome), privilegio) then
          raise exception 'Escrita residual: % possui % em %. Transacao cancelada.', papel, privilegio, nome;
        end if;
      end loop;
      if nome in ('admin_backups', 'evento_edicoes')
         and has_table_privilege(papel, format('public.%I', nome), 'SELECT') then
        raise exception 'Leitura residual de % em %. Transacao cancelada.', papel, nome;
      end if;
    end loop;
    foreach privilegio in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      if not has_table_privilege('service_role', format('public.%I', nome), privilegio) then
        raise exception 'Permissao administrativa % ausente em %. Transacao cancelada.', privilegio, nome;
      end if;
    end loop;
  end loop;
end $$;

commit;

select 'grupos' as tabela, count(*) as registros_preservados from public.grupos
union all select 'eventos', count(*) from public.eventos
union all select 'encontros', count(*) from public.encontros
union all select 'admin_backups', count(*) from public.admin_backups;
