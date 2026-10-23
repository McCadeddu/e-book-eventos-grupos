-- Migracao aditiva: preserva os cadastros originais e nao copia encontros.
-- Aplicar com postgres, antes de publicar os formularios anuais.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table if not exists public.grupo_edicoes (
  grupo_id text not null references public.grupos(id) on delete cascade,
  ano integer not null references public.ebook_edicoes(ano),
  nome text, faixa_etaria text, descricao text, objetivo_ano text,
  equipe jsonb, convite_final text, ativo boolean default true,
  primary key (grupo_id, ano)
);
alter table public.grupo_edicoes enable row level security;
alter table public.evento_edicoes enable row level security;
revoke all on public.grupo_edicoes, public.evento_edicoes from public, anon, authenticated;
grant select, insert, update, delete on public.grupo_edicoes, public.evento_edicoes to service_role;

-- Conteudo de cada edicao fica congelado antes de ativar a nova escrita.
-- ON CONFLICT preserva qualquer edicao que ja tenha sido preenchida.
insert into public.grupo_edicoes
  (grupo_id, ano, nome, faixa_etaria, descricao, objetivo_ano, equipe, convite_final, ativo)
select g.id, e.ano, g.nome, g.faixa_etaria, g.descricao, g.objetivo_ano,
       to_jsonb(g.equipe), g.convite_final, true
from public.grupos g cross join public.ebook_edicoes e
on conflict (grupo_id, ano) do nothing;
insert into public.evento_edicoes
  (evento_id, ano, titulo, faixa_etaria, descricao, equipe, objetivo_ano, convite,
   grupos_envolvidos, todos_os_grupos, visibilidade, ativo)
select v.id, e.ano, v.titulo, v.faixa_etaria, v.descricao, to_jsonb(v.equipe),
       v.objetivo_ano, v.convite, to_jsonb(v.grupos_envolvidos),
       v.todos_os_grupos, v.visibilidade, true
from public.eventos v cross join public.ebook_edicoes e
on conflict (evento_id, ano) do nothing;

-- Transacao unica para criar a identidade e suas edicoes ou editar so um ano.
-- Nao depende de parametros de role enviados pelo navegador.
create or replace function public.pascom_salvar_cadastro_anual(
  p_setor text, p_ano integer, p_dados jsonb, p_criar boolean default false
) returns jsonb
language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
  v jsonb; ident text; slug_grupo text; resultado jsonb;
  g public.grupos%rowtype; ev public.eventos%rowtype;
begin
  if p_setor is null or p_setor not in ('grupos', 'eventos') or p_dados is null or jsonb_typeof(p_dados) <> 'object'
     or not exists(select 1 from public.ebook_edicoes where ano = p_ano) then
    raise exception using errcode = '22023', message = 'Setor, ano ou dados invalidos.';
  end if;
  if p_setor = 'grupos' then
    if p_criar then
      ident := gen_random_uuid()::text;
      slug_grupo := nullif(p_dados->>'slug', '');
      if slug_grupo is null or nullif(btrim(p_dados->>'nome'), '') is null then
        raise exception using errcode='22023', message='Nome e slug obrigatorios.';
      end if;
      -- Slug e ordem pertencem a identidade; os textos sao salvos na edicao.
      perform pg_advisory_xact_lock(73842001);
      insert into public.grupos(id, slug, nome, ordem)
      select ident, slug_grupo, p_dados->>'nome', coalesce(max(ordem),0)+1 from public.grupos;
    else
      ident := p_dados->>'id';
    end if;
    select * into g from public.grupos where id=ident for update;
    if not found then raise exception using errcode='P0002', message='Grupo nao encontrado.'; end if;
    select to_jsonb(g) || coalesce(jsonb_strip_nulls(to_jsonb(x)), '{}'::jsonb) || p_dados
      into v from (select 1) dummy left join public.grupo_edicoes x
      on x.grupo_id=ident and x.ano=p_ano;
    if nullif(btrim(v->>'nome'), '') is null then
      raise exception using errcode='22023', message='Nome obrigatorio.';
    end if;
    insert into public.grupo_edicoes(grupo_id,ano,nome,faixa_etaria,descricao,objetivo_ano,equipe,convite_final,ativo)
    values(ident,p_ano,v->>'nome',v->>'faixa_etaria',v->>'descricao',v->>'objetivo_ano',
           v->'equipe',v->>'convite_final',coalesce((v->>'ativo')::boolean,true))
    on conflict(grupo_id,ano) do update set
      nome=excluded.nome,faixa_etaria=excluded.faixa_etaria,descricao=excluded.descricao,
      objetivo_ano=excluded.objetivo_ano,equipe=excluded.equipe,
      convite_final=excluded.convite_final,ativo=excluded.ativo;
    if p_criar then
      insert into public.grupo_edicoes(grupo_id,ano,ativo)
      select ident,ano,false from public.ebook_edicoes where ano<>p_ano
      on conflict do nothing;
    end if;
    resultado := jsonb_build_object('grupo',jsonb_build_object('id',ident,'slug',g.slug,'nome',v->>'nome'));
  else
    if p_criar then
      ident := gen_random_uuid()::text;
      if nullif(btrim(p_dados->>'titulo'), '') is null then
        raise exception using errcode='22023', message='Titulo obrigatorio.';
      end if;
      perform pg_advisory_xact_lock(73842002);
      insert into public.eventos(id,titulo,visibilidade,ordem)
      select ident::uuid,p_dados->>'titulo','interno',coalesce(max(ordem),0)+1 from public.eventos;
    else
      ident := p_dados->>'id';
    end if;
    select * into ev from public.eventos where id=ident::uuid for update;
    if not found then raise exception using errcode='P0002', message='Evento nao encontrado.'; end if;
    select to_jsonb(ev) || coalesce(jsonb_strip_nulls(to_jsonb(x)), '{}'::jsonb) || p_dados
      into v from (select 1) dummy left join public.evento_edicoes x
      on x.evento_id=ident::uuid and x.ano=p_ano;
    if nullif(btrim(v->>'titulo'), '') is null or coalesce(v->>'visibilidade','interno') not in ('publico','interno') then
      raise exception using errcode='22023', message='Titulo ou visibilidade invalidos.';
    end if;
    insert into public.evento_edicoes(evento_id,ano,titulo,faixa_etaria,descricao,equipe,objetivo_ano,convite,
                                    grupos_envolvidos,todos_os_grupos,visibilidade,ativo)
    values(ident::uuid,p_ano,v->>'titulo',v->>'faixa_etaria',v->>'descricao',v->'equipe',
           v->>'objetivo_ano',v->>'convite',v->'grupos_envolvidos',
           coalesce((v->>'todos_os_grupos')::boolean,false),v->>'visibilidade',coalesce((v->>'ativo')::boolean,true))
    on conflict(evento_id,ano) do update set
      titulo=excluded.titulo,faixa_etaria=excluded.faixa_etaria,descricao=excluded.descricao,
      equipe=excluded.equipe,objetivo_ano=excluded.objetivo_ano,convite=excluded.convite,
      grupos_envolvidos=excluded.grupos_envolvidos,todos_os_grupos=excluded.todos_os_grupos,
      visibilidade=excluded.visibilidade,ativo=excluded.ativo;
    if p_criar then
      insert into public.evento_edicoes(evento_id,ano,ativo)
      select ident::uuid,ano,false from public.ebook_edicoes where ano<>p_ano
      on conflict do nothing;
    end if;
    resultado := jsonb_build_object('evento',jsonb_build_object('id',ident));
  end if;
  return resultado || jsonb_build_object('sucesso',true,'ano',p_ano);
end $$;
revoke all on function public.pascom_salvar_cadastro_anual(text,integer,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.pascom_salvar_cadastro_anual(text,integer,jsonb,boolean) to service_role;
commit;

select 'grupo_edicoes' as tabela, ano, count(*) from public.grupo_edicoes group by ano
union all select 'evento_edicoes', ano, count(*) from public.evento_edicoes group by ano;
