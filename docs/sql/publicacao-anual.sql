create table if not exists public.grupo_edicoes (
  grupo_id text not null references public.grupos(id) on delete cascade,
  ano integer not null,
  nome text,
  faixa_etaria text,
  descricao text,
  objetivo_ano text,
  equipe jsonb,
  convite_final text,
  ativo boolean default true,
  primary key (grupo_id, ano)
);

create table if not exists public.evento_edicoes (
  evento_id text not null references public.eventos(id) on delete cascade,
  ano integer not null,
  titulo text,
  faixa_etaria text,
  descricao text,
  equipe jsonb,
  objetivo_ano text,
  convite text,
  grupos_envolvidos jsonb,
  todos_os_grupos boolean,
  visibilidade text,
  ativo boolean default true,
  primary key (evento_id, ano)
);

alter table public.grupo_edicoes disable row level security;
alter table public.evento_edicoes disable row level security;

comment on table public.grupo_edicoes is
  'Sobrescreve o conteudo editorial de um grupo para uma publicacao anual especifica.';

comment on table public.evento_edicoes is
  'Sobrescreve o conteudo editorial de um evento para uma publicacao anual especifica.';
