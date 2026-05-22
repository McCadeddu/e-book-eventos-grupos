create table if not exists public.admin_backups (
  id uuid primary key,
  created_at timestamptz not null default now(),
  capturado_em timestamptz,
  versao integer not null default 1,
  origem text not null,
  entidade text not null,
  acao text not null,
  referencia_id text,
  resumo jsonb not null default '{}'::jsonb,
  payload jsonb not null
);

alter table public.admin_backups disable row level security;

create index if not exists admin_backups_created_at_idx
  on public.admin_backups (created_at desc);

grant select, insert, delete on table public.admin_backups to anon, authenticated;
