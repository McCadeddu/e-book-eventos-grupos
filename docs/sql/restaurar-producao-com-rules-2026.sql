-- Restauração completa da produção 2026
-- 1. libera acesso da aplicação atual
-- 2. restaura grupos reais, eventos e encontros
-- 3. remove dos grupos os retiros promovidos para a tabela de eventos

alter table public.grupos disable row level security;
alter table public.encontros disable row level security;
alter table public.eventos disable row level security;

grant select, insert, update, delete on table public.grupos to anon, authenticated;
grant select, insert, update, delete on table public.encontros to anon, authenticated;
grant select, insert, update, delete on table public.eventos to anon, authenticated;

-- Depois deste cabeçalho, execute também nesta ordem:
-- 1. restaurar-fallback-2026-grupos.sql
-- 2. restaurar-fallback-2026-eventos.sql
-- 3. restaurar-fallback-2026-encontros-parte-01.sql
-- 4. restaurar-fallback-2026-encontros-parte-02.sql
-- 5. restaurar-fallback-2026-encontros-parte-03.sql
-- 6. restaurar-fallback-2026-encontros-parte-04.sql
-- 7. restaurar-fallback-2026-encontros-parte-05.sql
-- 8. restaurar-fallback-2026-limpeza.sql
