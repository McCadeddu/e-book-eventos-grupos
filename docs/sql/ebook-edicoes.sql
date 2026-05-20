create table if not exists public.ebook_edicoes (
  ano integer primary key,
  titulo text not null,
  subtitulo text,
  botao_texto text,
  capas jsonb not null default '[]'::jsonb,
  logo text
);

create table if not exists public.ebook_estado (
  id text primary key,
  ano_publicado integer not null,
  ano_em_preparacao integer not null
);

alter table public.ebook_edicoes disable row level security;
alter table public.ebook_estado disable row level security;

insert into public.ebook_edicoes (ano, titulo, subtitulo, botao_texto, capas, logo)
values
  (
    2026,
    'Agenda dos Grupos e Eventos',
    'Comunidade de Belo Horizonte',
    'Abrir agenda',
    '["/villaregia-capa.png"]'::jsonb,
    '/villaregia-logo.png'
  ),
  (
    2027,
    'Agenda dos Grupos e Eventos',
    'Comunidade de Belo Horizonte',
    'Abrir agenda',
    '["/villaregia-capa.png"]'::jsonb,
    '/villaregia-logo.png'
  )
on conflict (ano) do nothing;

insert into public.ebook_estado (id, ano_publicado, ano_em_preparacao)
values ('principal', 2026, 2027)
on conflict (id) do update
set
  ano_publicado = excluded.ano_publicado,
  ano_em_preparacao = excluded.ano_em_preparacao;
