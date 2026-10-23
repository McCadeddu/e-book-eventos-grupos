-- Executar APENAS dentro de uma transacao e terminar com ROLLBACK.
-- A preparacao desta sessao deve ter aplicado conteudos-anuais.sql sem COMMIT.
-- Todas as alteracoes de teste sao desfeitas, incluindo as novas identidades.
do $$
declare
  bases jsonb; anteriores jsonb; r jsonb; gid text; eid uuid;
begin
  select jsonb_build_array(
    (select jsonb_agg(to_jsonb(g) order by id) from public.grupos g),
    (select jsonb_agg(to_jsonb(e) order by id) from public.eventos e),
    (select jsonb_agg(to_jsonb(e) order by id) from public.encontros e)
  ) into bases;
  select jsonb_build_array(
    (select jsonb_agg(to_jsonb(g) order by grupo_id) from public.grupo_edicoes g where ano=2026),
    (select jsonb_agg(to_jsonb(e) order by evento_id) from public.evento_edicoes e where ano=2026)
  ) into anteriores;
  select id into gid from public.grupos order by id limit 1;
  select id into eid from public.eventos order by id limit 1;
  perform public.pascom_salvar_cadastro_anual('grupos',2027,
    jsonb_build_object('id',gid,'nome','TESTE ANUAL 2027','objetivo_ano','','equipe','[]'::jsonb));
  perform public.pascom_salvar_cadastro_anual('eventos',2027,
    jsonb_build_object('id',eid,'titulo','TESTE ANUAL 2027','visibilidade','interno','grupos_envolvidos','[]'::jsonb));
  if not exists(select 1 from public.grupo_edicoes where grupo_id=gid and ano=2027
     and nome='TESTE ANUAL 2027' and objetivo_ano='' and equipe='[]'::jsonb) then
    raise exception 'Edicao do grupo nao guardou campos vazios.';
  end if;
  if not exists(select 1 from public.evento_edicoes where evento_id=eid and ano=2027
     and titulo='TESTE ANUAL 2027' and visibilidade='interno' and grupos_envolvidos='[]'::jsonb) then
    raise exception 'Edicao do evento nao guardou alteracoes.';
  end if;
  if bases <> jsonb_build_array(
    (select jsonb_agg(to_jsonb(g) order by id) from public.grupos g),
    (select jsonb_agg(to_jsonb(e) order by id) from public.eventos e),
    (select jsonb_agg(to_jsonb(e) order by id) from public.encontros e)
  ) then raise exception 'Editar uma edicao alterou cadastros globais ou encontros.'; end if;
  if anteriores <> jsonb_build_array(
    (select jsonb_agg(to_jsonb(g) order by grupo_id) from public.grupo_edicoes g where ano=2026),
    (select jsonb_agg(to_jsonb(e) order by evento_id) from public.evento_edicoes e where ano=2026)
  ) then raise exception 'Editar 2027 alterou 2026.'; end if;

  r := public.pascom_salvar_cadastro_anual('grupos',2027,
    '{"nome":"TESTE NOVO 2027","slug":"teste-transacao-anual-2027"}',true);
  gid := r->'grupo'->>'id';
  if not exists(select 1 from public.grupo_edicoes where grupo_id=gid and ano=2027 and ativo)
     or not exists(select 1 from public.grupo_edicoes where grupo_id=gid and ano=2026 and not ativo) then
    raise exception 'Grupo novo vazou para outro ano.';
  end if;
  r := public.pascom_salvar_cadastro_anual('eventos',2027,
    '{"titulo":"TESTE NOVO 2027","visibilidade":"publico"}',true);
  eid := (r->'evento'->>'id')::uuid;
  if not exists(select 1 from public.evento_edicoes where evento_id=eid and ano=2027 and ativo and visibilidade='publico')
     or not exists(select 1 from public.evento_edicoes where evento_id=eid and ano=2026 and not ativo)
     or not exists(select 1 from public.eventos where id=eid and visibilidade='interno') then
    raise exception 'Evento novo vazou para outro ano ou cadastro global publico.';
  end if;
  begin
    perform public.pascom_salvar_cadastro_anual('grupos',2099,'{"nome":"INVALIDO"}',true);
    raise exception 'Ano nao configurado aceito.';
  exception when sqlstate '22023' then null;
  end;
  if has_function_privilege('anon','public.pascom_salvar_cadastro_anual(text,integer,jsonb,boolean)','EXECUTE')
     or has_function_privilege('authenticated','public.pascom_salvar_cadastro_anual(text,integer,jsonb,boolean)','EXECUTE') then
    raise exception 'RPC anual acessivel sem servidor administrativo.';
  end if;
end $$;
