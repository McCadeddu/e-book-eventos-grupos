create table if not exists public.admin_backups (
  id uuid primary key,
  created_at timestamptz not null default now(),
  origem text not null,
  entidade text not null,
  acao text not null,
  referencia_id text,
  resumo jsonb not null default '{}'::jsonb,
  payload jsonb not null
);

grant select, insert on table public.admin_backups to anon, authenticated;
